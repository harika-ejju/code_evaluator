import os
import sys
import tempfile
import shutil
import subprocess
import time
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import git
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Multi-Language Code Runner & Analyzer", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],  # NextJS dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class RepositoryRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"
    specific_file: Optional[str] = None  # Path to specific file to analyze

class ExecutionResult(BaseModel):
    success: bool
    output: str
    error: str
    execution_time: float
    exit_code: int

class FileInfo(BaseModel):
    path: str
    relative_path: str
    filename: str
    language: str
    size: int
    is_executable: bool
    priority: int

class AnalysisResponse(BaseModel):
    repository_url: str
    analyzed_file_found: bool
    analyzed_file_path: str
    analyzed_file_content: str
    analyzed_file_language: str
    all_files: List[FileInfo]
    execution_result: ExecutionResult
    ai_score: float
    ai_insights: str
    recommendations: str

def clone_repository(repo_url: str, branch: str = "main") -> str:
    """Clone Git repository and return temporary directory path."""
    # Validate and normalize the URL
    repo_url = validate_git_url(repo_url)
    
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        # Try the specified branch first
        try:
            git.Repo.clone_from(repo_url, temp_dir, branch=branch, depth=1)
            return temp_dir
        except git.exc.GitCommandError as e:
            # If the specified branch doesn't exist, try common branch names
            shutil.rmtree(temp_dir, ignore_errors=True)
            temp_dir = tempfile.mkdtemp()
            
            if "main" in str(e) and branch == "main":
                # Try master branch if main doesn't exist
                try:
                    git.Repo.clone_from(repo_url, temp_dir, branch="master", depth=1)
                    return temp_dir
                except git.exc.GitCommandError:
                    pass
            
            # If both main and master fail, try without specifying branch
            shutil.rmtree(temp_dir, ignore_errors=True)
            temp_dir = tempfile.mkdtemp()
            git.Repo.clone_from(repo_url, temp_dir, depth=1)
            return temp_dir
            
    except Exception as e:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}. Please ensure the URL is a valid Git repository (should end with .git)")

def detect_language(filename: str) -> str:
    """Detect programming language based on file extension."""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    language_map = {
        'py': 'Python',
        'js': 'JavaScript',
        'mjs': 'JavaScript',
        'jsx': 'React',
        'ts': 'TypeScript',
        'tsx': 'TypeScript React',
        'java': 'Java',
        'go': 'Go',
        'rs': 'Rust',
        'c': 'C',
        'cpp': 'C++',
        'cc': 'C++',
        'cxx': 'C++',
        'h': 'C Header',
        'hpp': 'C++ Header',
        'php': 'PHP',
        'rb': 'Ruby',
        'cs': 'C#',
        'swift': 'Swift',
        'kt': 'Kotlin',
        'scala': 'Scala',
        'r': 'R',
        'sh': 'Shell',
        'bash': 'Bash',
        'ps1': 'PowerShell',
        'sql': 'SQL',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'less': 'LESS',
        'json': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'yml': 'YAML',
        'md': 'Markdown',
        'dockerfile': 'Docker',
    }
    
    if filename.lower() == 'dockerfile':
        return 'Docker'
    elif filename.lower() == 'makefile':
        return 'Makefile'
    
    return language_map.get(ext, 'Unknown')

def is_executable_file(filename: str, language: str) -> bool:
    """Check if a file is potentially executable."""
    executable_patterns = {
        'Python': ['main.py', 'app.py', 'run.py', 'start.py', 'server.py', 'manage.py'],
        'JavaScript': ['index.js', 'app.js', 'server.js', 'main.js', 'start.js'],
        'TypeScript': ['index.ts', 'app.ts', 'server.ts', 'main.ts'],
        'React': ['App.jsx', 'index.jsx', 'App.tsx', 'index.tsx'],
        'Java': ['Main.java', 'App.java', 'Application.java'],
        'Go': ['main.go'],
        'Rust': ['main.rs'],
        'C': ['main.c'],
        'C++': ['main.cpp', 'main.cc', 'main.cxx'],
    }
    
    if language in executable_patterns:
        return any(pattern.lower() in filename.lower() for pattern in executable_patterns[language])
    
    return False

def find_all_code_files(repo_path: str) -> List[FileInfo]:
    """Find all code files in the repository."""
    code_files = []
    
    # Skip common directories that don't contain main code
    skip_dirs = {'.git', '__pycache__', '.pytest_cache', 'venv', 'env', 'node_modules', 
                '.tox', 'build', 'dist', '.idea', '.vscode', '.vs', 'bin', 'obj',
                'target', 'out', '.gradle', '.mvn', 'coverage', '.nyc_output'}
    
    # Supported file extensions for code analysis
    code_extensions = {'.py', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.java', '.go', 
                      '.rs', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.php', 
                      '.rb', '.cs', '.swift', '.kt', '.scala', '.r', '.sh', '.bash'}
    
    for root, dirs, files in os.walk(repo_path):
        # Filter out directories to skip
        dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]
        
        for file in files:
            if file.startswith('.'):
                continue
                
            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, repo_path)
            
            # Check if it's a code file
            file_ext = '.' + file.split('.')[-1].lower() if '.' in file else ''
            language = detect_language(file)
            
            if file_ext in code_extensions or language != 'Unknown':
                try:
                    file_size = os.path.getsize(full_path)
                    is_exec = is_executable_file(file, language)
                    priority = get_file_priority(file, relative_path, language)
                    
                    code_files.append(FileInfo(
                        path=full_path,
                        relative_path=relative_path,
                        filename=file,
                        language=language,
                        size=file_size,
                        is_executable=is_exec,
                        priority=priority
                    ))
                except (OSError, IOError):
                    # Skip files we can't read
                    continue
    
    # Sort by priority (higher priority first)
    code_files.sort(key=lambda x: x.priority, reverse=True)
    return code_files
    """Find all Python files in the repository and suggest the best entry point."""
    python_files = []
    
    # Skip common directories that don't contain main code
    skip_dirs = {'.git', '__pycache__', '.pytest_cache', 'venv', 'env', 'node_modules', 
                '.tox', 'build', 'dist', '.idea', '.vscode', 'tests', 'test'}
    
    for root, dirs, files in os.walk(repo_path):
        # Filter out directories to skip
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if file.endswith('.py') and not file.startswith('_'):
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, repo_path)
                python_files.append({
                    'path': full_path,
                    'relative_path': relative_path,
                    'filename': file,
                    'priority': get_file_priority(file, relative_path)
                })
    
    # Sort by priority (higher priority first)
    python_files.sort(key=lambda x: x['priority'], reverse=True)
    return python_files

def get_file_priority(filename: str, relative_path: str, language: str) -> int:
    """Assign priority to files based on how likely they are to be entry points."""
    priority = 0
    
    # Language-specific high priority entry points
    high_priority_files = {
        'Python': ['main.py', 'app.py', 'run.py', 'start.py', 'server.py', 'manage.py'],
        'JavaScript': ['index.js', 'app.js', 'server.js', 'main.js', 'start.js'],
        'TypeScript': ['index.ts', 'app.ts', 'server.ts', 'main.ts'],
        'React': ['App.jsx', 'index.jsx', 'App.tsx', 'index.tsx'],
        'TypeScript React': ['App.tsx', 'index.tsx'],
        'Java': ['Main.java', 'App.java', 'Application.java'],
        'Go': ['main.go'],
        'Rust': ['main.rs'],
        'C': ['main.c'],
        'C++': ['main.cpp', 'main.cc', 'main.cxx'],
    }
    
    # High priority for common entry point names
    if language in high_priority_files:
        if filename in high_priority_files[language]:
            priority += 100
        elif any(pattern.lower() in filename.lower() for pattern in high_priority_files[language]):
            priority += 80
    
    # Medium priority for files in root directory
    if '/' not in relative_path.replace('\\', '/'):
        priority += 50
    
    # Special priority for certain directories
    path_parts = relative_path.lower().replace('\\', '/').split('/')
    if 'src' in path_parts:
        priority += 30
    if 'lib' in path_parts or 'libs' in path_parts:
        priority += 20
    if 'example' in path_parts or 'examples' in path_parts:
        priority += 10
    
    # Lower priority for deeply nested files
    depth = relative_path.count('/') + relative_path.count('\\')
    priority -= depth * 5
    
    # Bonus for certain keywords in filename
    keywords = ['main', 'app', 'run', 'start', 'server', 'index', 'demo', 'example']
    for keyword in keywords:
        if keyword in filename.lower():
            priority += 15
    
    # Language-specific bonuses
    if language == 'Python':
        priority += 10  # Slight preference for Python files
    elif language in ['JavaScript', 'TypeScript', 'React', 'TypeScript React']:
        priority += 8
    elif language == 'Java':
        priority += 6
    
    return priority

def find_best_file(repo_path: str, specific_file: Optional[str] = None) -> Optional[FileInfo]:
    """Find the best file to execute in the repository."""
    all_files = find_all_code_files(repo_path)
    
    if not all_files:
        return None
    
    # If a specific file is requested, find and return it
    if specific_file:
        for file_info in all_files:
            if file_info.relative_path == specific_file or file_info.path.endswith(specific_file):
                return file_info
        # If specific file not found, fall back to best file
    
    # Return the highest priority file
    return all_files[0] if all_files else None

def execute_file(file_info: FileInfo) -> ExecutionResult:
    """Execute file based on its language and capture output."""
    try:
        start_time = time.time()
        
        # Change to the directory containing the file
        work_dir = os.path.dirname(file_info.path)
        filename = file_info.filename
        
        # Determine execution command based on language
        if file_info.language == 'Python':
            cmd = [sys.executable, filename]
        elif file_info.language in ['JavaScript', 'TypeScript']:
            # Check if it's a Node.js project
            if os.path.exists(os.path.join(work_dir, 'package.json')):
                # Try npm start first, then node
                try:
                    result = subprocess.run(['npm', 'start'], cwd=work_dir, capture_output=True, text=True, timeout=30)
                    if result.returncode == 0:
                        execution_time = time.time() - start_time
                        return ExecutionResult(
                            success=True,
                            output=result.stdout,
                            error=result.stderr,
                            execution_time=execution_time,
                            exit_code=result.returncode
                        )
                except:
                    pass
            cmd = ['node', filename]
        elif file_info.language in ['React', 'TypeScript React']:
            # For React files, try npm start
            if os.path.exists(os.path.join(work_dir, 'package.json')):
                cmd = ['npm', 'start']
            else:
                cmd = ['node', filename]
        elif file_info.language == 'Java':
            # Compile and run Java
            class_name = filename.replace('.java', '')
            compile_result = subprocess.run(['javac', filename], cwd=work_dir, capture_output=True, text=True, timeout=30)
            if compile_result.returncode != 0:
                return ExecutionResult(
                    success=False,
                    output=compile_result.stdout,
                    error=f"Compilation failed: {compile_result.stderr}",
                    execution_time=time.time() - start_time,
                    exit_code=compile_result.returncode
                )
            cmd = ['java', class_name]
        elif file_info.language == 'Go':
            cmd = ['go', 'run', filename]
        elif file_info.language == 'Rust':
            # Compile and run Rust
            exe_name = filename.replace('.rs', '')
            compile_result = subprocess.run(['rustc', filename, '-o', exe_name], cwd=work_dir, capture_output=True, text=True, timeout=30)
            if compile_result.returncode != 0:
                return ExecutionResult(
                    success=False,
                    output=compile_result.stdout,
                    error=f"Compilation failed: {compile_result.stderr}",
                    execution_time=time.time() - start_time,
                    exit_code=compile_result.returncode
                )
            cmd = [f'./{exe_name}']
        elif file_info.language == 'C':
            # Compile and run C
            exe_name = filename.replace('.c', '')
            compile_result = subprocess.run(['gcc', filename, '-o', exe_name], cwd=work_dir, capture_output=True, text=True, timeout=30)
            if compile_result.returncode != 0:
                return ExecutionResult(
                    success=False,
                    output=compile_result.stdout,
                    error=f"Compilation failed: {compile_result.stderr}",
                    execution_time=time.time() - start_time,
                    exit_code=compile_result.returncode
                )
            cmd = [f'./{exe_name}']
        elif file_info.language == 'C++':
            # Compile and run C++
            exe_name = filename.replace('.cpp', '').replace('.cc', '').replace('.cxx', '')
            compile_result = subprocess.run(['g++', filename, '-o', exe_name], cwd=work_dir, capture_output=True, text=True, timeout=30)
            if compile_result.returncode != 0:
                return ExecutionResult(
                    success=False,
                    output=compile_result.stdout,
                    error=f"Compilation failed: {compile_result.stderr}",
                    execution_time=time.time() - start_time,
                    exit_code=compile_result.returncode
                )
            cmd = [f'./{exe_name}']
        else:
            return ExecutionResult(
                success=False,
                output="",
                error=f"Execution not supported for {file_info.language} files",
                execution_time=0.0,
                exit_code=-1
            )
        
        # Execute the command
        result = subprocess.run(
            cmd,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=30  # 30 second timeout
        )
        
        execution_time = time.time() - start_time
        
        return ExecutionResult(
            success=result.returncode == 0,
            output=result.stdout,
            error=result.stderr,
            execution_time=execution_time,
            exit_code=result.returncode
        )
        
    except subprocess.TimeoutExpired:
        return ExecutionResult(
            success=False,
            output="",
            error="Execution timed out after 30 seconds",
            execution_time=30.0,
            exit_code=-1
        )
    except Exception as e:
        return ExecutionResult(
            success=False,
            output="",
            error=f"Execution error: {str(e)}",
            execution_time=0.0,
            exit_code=-1
        )

def get_ai_analysis(code_content: str, execution_result: ExecutionResult) -> tuple:
    """Get AI analysis and scoring from Gemini."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Analyze this Python main.py file and its execution results:

        CODE:
        ```python
        {code_content[:3000]}  # Limit code length for API
        ```

        EXECUTION RESULTS:
        - Success: {execution_result.success}
        - Exit Code: {execution_result.exit_code}
        - Execution Time: {execution_result.execution_time:.2f} seconds
        - Output: {execution_result.output[:1000] if execution_result.output else "No output"}
        - Error: {execution_result.error[:1000] if execution_result.error else "No errors"}

        SCORING GUIDELINES:
        - If code executes successfully (exit_code 0): Give 100 points (perfect score)
        - If code has syntax errors or fails to run: 20-60 points
        - Working code deserves full marks regardless of complexity
        - Simple working code should get 100 points
        - Focus analysis on code structure and recommendations rather than scoring

        Please provide a comprehensive analysis with:
        1. Overall code quality score (0-100) - BE GENEROUS for working code
        2. Code structure and best practices assessment
        3. Execution analysis (success/failure reasons)
        4. Specific recommendations for improvement
        5. Security considerations if any

        Format your response as:
        SCORE: [number 0-100]
        INSIGHTS: [detailed analysis of code quality, structure, and execution]
        RECOMMENDATIONS: [specific actionable recommendations]
        """
        
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Parse response
        lines = response_text.split('\n')
        
        # Default scoring based on execution success
        if execution_result.success and execution_result.exit_code == 0:
            score = 100.0  # Perfect score for working code
        else:
            score = 40.0  # Default lower score for non-working code
            
        insights = ""
        recommendations = ""
        
        current_section = ""
        for line in lines:
            if line.startswith('SCORE:'):
                try:
                    parsed_score = float(line.split('SCORE:')[1].strip())
                    # Ensure working code gets perfect score
                    if execution_result.success and execution_result.exit_code == 0:
                        score = 100.0  # Perfect score for working code
                    else:
                        score = parsed_score
                except:
                    pass
            elif line.startswith('INSIGHTS:'):
                current_section = "insights"
                insights = line.split('INSIGHTS:')[1].strip()
            elif line.startswith('RECOMMENDATIONS:'):
                current_section = "recommendations"
                recommendations = line.split('RECOMMENDATIONS:')[1].strip()
            elif current_section == "insights" and line.strip():
                insights += "\n" + line
            elif current_section == "recommendations" and line.strip():
                recommendations += "\n" + line
        
        return score, insights.strip(), recommendations.strip()
        
    except Exception as e:
        # Provide intelligent fallback scoring based on execution results
        fallback_score = 100.0 if execution_result.success and execution_result.exit_code == 0 else 40.0
        
        error_msg = str(e)
        if "API_KEY_INVALID" in error_msg:
            fallback_insights = "AI analysis unavailable due to invalid API key. Please check your Gemini API key in the .env file. However, based on execution results: "
        else:
            fallback_insights = f"AI analysis unavailable: {error_msg}. Based on execution results: "
            
        if execution_result.success:
            fallback_insights += "✅ Code executed successfully with no errors. This indicates good basic functionality."
        else:
            fallback_insights += "❌ Code execution failed. Please check the error details for debugging."
            
        fallback_recommendations = []
        if not execution_result.success:
            fallback_recommendations.append("Fix execution errors before proceeding")
        if not error_msg or "API_KEY_INVALID" in error_msg:
            fallback_recommendations.append("Set up a valid Gemini API key for detailed AI analysis")
        fallback_recommendations.append("Test the code with various inputs")
        fallback_recommendations.append("Add error handling and input validation")
        
        return fallback_score, fallback_insights, " • ".join(fallback_recommendations)

def test_gemini_api_key() -> tuple[bool, str]:
    """Test if the Gemini API key is valid."""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_actual_gemini_api_key_here" or api_key == "demo_key_please_replace_with_real_key":
            return False, "API key not configured. Please set GEMINI_API_KEY in .env file."
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello")
        return True, "API key is valid"
    except Exception as e:
        return False, f"API key validation failed: {str(e)}"

def validate_git_url(url: str) -> str:
    """Validate and normalize Git repository URL."""
    url = url.strip()
    
    # Check if it's a valid Git URL format
    if not url:
        raise HTTPException(status_code=400, detail="Repository URL cannot be empty")
    
    # Handle GitHub URLs that might be browser URLs instead of Git URLs
    if "github.com" in url and "/blob/" in url:
        raise HTTPException(
            status_code=400, 
            detail="Invalid URL format. Please use the Git repository URL (should end with .git), not a file browser URL. Example: https://github.com/username/repository.git"
        )
    
    # Add .git suffix if missing for GitHub URLs
    if "github.com" in url and not url.endswith(".git"):
        if not url.endswith("/"):
            url += ".git"
        else:
            url = url.rstrip("/") + ".git"
    
    return url

@app.get("/")
async def root():
    return {"message": "Python Code Runner & Analyzer API is running!"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_repository(request: RepositoryRequest):
    """Analyze Python files from a Git repository."""
    temp_dir = None
    
    try:
        # Clone repository
        request.repo_url = validate_git_url(request.repo_url)  # Validate and normalize URL
        temp_dir = clone_repository(request.repo_url, request.branch)
        
        # Find all Python files
        python_files = find_python_files(temp_dir)
        
        if not python_files:
            return AnalysisResponse(
                repository_url=request.repo_url,
                python_file_found=False,
                python_file_path="",
                python_file_content="",
                all_python_files=[],
                execution_result=ExecutionResult(
                    success=False,
                    output="",
                    error="No Python files found in repository",
                    execution_time=0.0,
                    exit_code=-1
                ),
                ai_score=0.0,
                ai_insights="No Python files found in the repository. Please ensure the repository contains Python (.py) files.",
                recommendations="Add Python files to the repository or check if this is the correct repository URL."
            )
        
        # Get the best Python file to execute
        best_file_path = find_best_python_file(temp_dir)
        
        # Read the best file's content
        try:
            with open(best_file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read Python file: {str(e)}")
        
        # Execute the Python file
        execution_result = execute_python_file(best_file_path)
        
        # Get AI analysis
        ai_score, ai_insights, recommendations = get_ai_analysis(file_content, execution_result)
        
        # Prepare file list for response
        file_list = [f['relative_path'] for f in python_files[:10]]  # Limit to top 10 files
        
        return AnalysisResponse(
            repository_url=request.repo_url,
            python_file_found=True,
            python_file_path=os.path.relpath(best_file_path, temp_dir),
            python_file_content=file_content,
            all_python_files=file_list,
            execution_result=execution_result,
            ai_score=ai_score,
            ai_insights=ai_insights,
            recommendations=recommendations
        )
        
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

@app.get("/health")
async def health_check():
    """Health check endpoint with API key validation."""
    api_key_valid, api_key_message = test_gemini_api_key()
    return {
        "status": "healthy",
        "api_key_valid": api_key_valid,
        "api_key_message": api_key_message,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }

def find_main_py(repo_path: str) -> Optional[str]:
    """Find main.py file in the repository."""
    # Search for main.py in common locations
    common_paths = [
        "main.py",
        "src/main.py",
        "app/main.py", 
        "code/main.py",
        "python/main.py",
        "scripts/main.py",
        "examples/main.py",
        "demo/main.py",
        "Tools/main.py",  # For CPython
        "tools/main.py",
        "bin/main.py",
        "run.py",         # Common alternative
        "start.py",       # Common alternative
        "app.py",         # Flask/FastAPI apps
        "server.py",      # Server applications
        "manage.py"       # Django projects
    ]
    
    for path in common_paths:
        full_path = os.path.join(repo_path, path)
        if os.path.exists(full_path):
            return full_path
    
    # If not found in common locations, search recursively
    for root, dirs, files in os.walk(repo_path):
        # Skip common directories that don't contain main code
        dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', '.pytest_cache', 'venv', 'env', 'node_modules', '.tox', 'build', 'dist', '.idea', '.vscode']]
        
        if "main.py" in files:
            return os.path.join(root, "main.py")
        
        # Look for other potential entry points
        for alternative in ["run.py", "start.py", "app.py", "server.py", "manage.py"]:
            if alternative in files:
                return os.path.join(root, alternative)
    
    return None

import os
import sys
import tempfile
import shutil
import subprocess
import time
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import git
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()

app = FastAPI(title="Multi-Language Code Runner & Analyzer", version="2.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class RepositoryRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None
    specific_file: Optional[str] = None
    bulk_analyze: Optional[bool] = False

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

class ComplexityAnalysis(BaseModel):
    time_complexity: str
    space_complexity: str
    optimization_level: str  # "Optimal", "Good", "Average", "Poor", "Brute Force"
    complexity_score: int  # 0-100
    explanation: str

class CodeQualityMetrics(BaseModel):
    syntax_score: int  # 0-100
    readability_score: int  # 0-100
    maintainability_score: int  # 0-100
    duplicate_code_penalty: int  # 0-50 (penalty points)
    best_practices_score: int  # 0-100
    overall_quality_score: int  # 0-100

class FileAnalysisResult(BaseModel):
    file_info: FileInfo
    content: str
    execution_result: Optional[ExecutionResult]
    ai_score: float
    complexity_analysis: Optional[ComplexityAnalysis]
    quality_metrics: CodeQualityMetrics
    ai_insights: str
    recommendations: str
    analysis_timestamp: str

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

class BulkAnalysisResponse(BaseModel):
    repository_url: str
    branch: str
    total_files: int
    analyzed_files: List[FileAnalysisResult]
    repository_overview: str
    overall_repository_score: float
    language_distribution: Dict[str, int]
    analysis_summary: str
    top_issues: List[str]
    recommendations: List[str]

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
        priority += 10
    elif language in ['JavaScript', 'TypeScript', 'React', 'TypeScript React']:
        priority += 8
    elif language == 'Java':
        priority += 6

    return priority

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

def validate_git_url(url: str) -> str:
    """Validate and normalize Git repository URL."""
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="Repository URL is required")

    url = url.strip()

    # Convert GitHub browser URLs to Git URLs
    if "github.com" in url and not url.endswith(".git"):
        if not url.endswith("/"):
            url += "/"
        url = url.replace("github.com/", "github.com/").rstrip("/") + ".git"

    # Basic validation
    if not any(pattern in url.lower() for pattern in ["github.com", "gitlab.com", "bitbucket.org", ".git"]):
        raise HTTPException(status_code=400, detail="Please provide a valid Git repository URL")

    return url

def clone_repository(repo_url: str, branch: str = None) -> str:
    """Clone Git repository and return temporary directory path."""
    repo_url = validate_git_url(repo_url)

    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        
        # If no branch specified or empty string, clone without branch specification (uses default)
        if not branch or not branch.strip():
            try:
                git.Repo.clone_from(repo_url, temp_dir, depth=1)
                return temp_dir
            except git.exc.GitCommandError as e:
                shutil.rmtree(temp_dir, ignore_errors=True)
                raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")
        
        # If branch is specified, try to clone that specific branch
        try:
            git.Repo.clone_from(repo_url, temp_dir, branch=branch, depth=1)
            return temp_dir
        except git.exc.GitCommandError as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            temp_dir = tempfile.mkdtemp()

            # Fallback logic: if 'main' fails, try 'master'
            if "main" in str(e) and branch == "main":
                try:
                    git.Repo.clone_from(repo_url, temp_dir, branch="master", depth=1)
                    return temp_dir
                except git.exc.GitCommandError:
                    pass

            # Final fallback: clone default branch
            shutil.rmtree(temp_dir, ignore_errors=True)
            temp_dir = tempfile.mkdtemp()
            git.Repo.clone_from(repo_url, temp_dir, depth=1)
            return temp_dir

    except Exception as e:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")

def execute_file(file_info: FileInfo) -> ExecutionResult:
    """Execute file based on its language and capture output."""
    try:
        start_time = time.time()
        work_dir = os.path.dirname(file_info.path)
        filename = file_info.filename

        # Determine execution command based on language
        if file_info.language == 'Python':
            cmd = [sys.executable, filename]
        elif file_info.language in ['JavaScript', 'TypeScript']:
            if os.path.exists(os.path.join(work_dir, 'package.json')):
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
            if os.path.exists(os.path.join(work_dir, 'package.json')):
                cmd = ['npm', 'start']
            else:
                cmd = ['node', filename]
        elif file_info.language == 'Java':
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
        else:
            return ExecutionResult(
                success=False,
                output="",
                error=f"Execution not supported for {file_info.language} files",
                execution_time=0.0,
                exit_code=-1
            )

        result = subprocess.run(
            cmd,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=30
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

def get_ai_analysis(code_content: str, execution_result: ExecutionResult, language: str) -> tuple:
    """Get AI analysis and scoring from Gemini."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
        Analyze this {language} code file and its execution results:

        CODE:
        ```{language.lower()}
        {code_content[:2000]}
        ```

        EXECUTION RESULTS:
        - Success: {execution_result.success}
        - Exit Code: {execution_result.exit_code}
        - Execution Time: {execution_result.execution_time:.2f} seconds
        - Output: {execution_result.output[:500] if execution_result.output else "No output"}
        - Error: {execution_result.error[:500] if execution_result.error else "No errors"}

        Please provide:
        SCORE: [number 0-100]
        INSIGHTS: [brief analysis of code quality and execution]
        RECOMMENDATIONS: [specific actionable recommendations]
        """

        response = model.generate_content(prompt)
        response_text = response.text

        # Parse response
        lines = response_text.split('\n')

        # Default scoring based on execution success
        if execution_result.success and execution_result.exit_code == 0:
            score = 100.0
        else:
            score = 40.0

        insights = ""
        recommendations = ""

        current_section = ""
        for line in lines:
            if line.startswith('SCORE:'):
                try:
                    parsed_score = float(line.split('SCORE:')[1].strip())
                    if execution_result.success and execution_result.exit_code == 0:
                        score = 100.0
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
        fallback_score = 100.0 if execution_result.success and execution_result.exit_code == 0 else 40.0

        fallback_insights = f"Analysis unavailable: {str(e)}. Based on execution results: "
        if execution_result.success:
            fallback_insights += "✅ Code executed successfully with no errors."
        else:
            fallback_insights += "❌ Code execution failed. Please check the error details."

        fallback_recommendations = [
            "Fix execution errors before proceeding" if not execution_result.success else "Great! Code executes successfully",
            "Add error handling and input validation",
            "Consider adding documentation and comments",
            "Test the code with various inputs"
        ]

        return fallback_score, fallback_insights, "\n".join(fallback_recommendations)

@app.get("/files")
async def get_repository_files(repo_url: str, branch: str = None):
    """Get all files in a repository without analysis."""
    temp_dir = None
    try:
        temp_dir = clone_repository(repo_url, branch)
        all_files = find_all_code_files(temp_dir)
        return {"files": all_files[:50]}  # Limit to 50 files
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_repository(request: RepositoryRequest):
    """Analyze a Git repository and run code analysis."""
    temp_dir = None

    try:
        temp_dir = clone_repository(request.repo_url, request.branch)
        all_files = find_all_code_files(temp_dir)

        if not all_files:
            return AnalysisResponse(
                repository_url=request.repo_url,
                analyzed_file_found=False,
                analyzed_file_path="",
                analyzed_file_content="",
                analyzed_file_language="",
                all_files=[],
                execution_result=ExecutionResult(
                    success=False,
                    output="",
                    error="No code files found in repository",
                    execution_time=0.0,
                    exit_code=-1
                ),
                ai_score=0.0,
                ai_insights="No code files found in the repository.",
                recommendations="Add code files (Python, JavaScript, Java, etc.) to the repository."
            )

        best_file = find_best_file(temp_dir, request.specific_file)

        if not best_file:
            return AnalysisResponse(
                repository_url=request.repo_url,
                analyzed_file_found=False,
                analyzed_file_path="",
                analyzed_file_content="",
                analyzed_file_language="",
                all_files=all_files[:20],
                execution_result=ExecutionResult(
                    success=False,
                    output="",
                    error="No suitable executable file found",
                    execution_time=0.0,
                    exit_code=-1
                ),
                ai_score=0.0,
                ai_insights="No suitable executable file found for analysis.",
                recommendations="Add a main entry point file for your chosen programming language."
            )

        try:
            with open(best_file.path, 'r', encoding='utf-8') as f:
                file_content = f.read()
        except UnicodeDecodeError:
            try:
                with open(best_file.path, 'r', encoding='latin-1') as f:
                    file_content = f.read()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

        execution_result = execute_file(best_file)
        ai_score, ai_insights, recommendations = get_ai_analysis(file_content, execution_result, best_file.language)

        return AnalysisResponse(
            repository_url=request.repo_url,
            analyzed_file_found=True,
            analyzed_file_path=best_file.relative_path,
            analyzed_file_content=file_content,
            analyzed_file_language=best_file.language,
            all_files=all_files[:20],
            execution_result=execution_result,
            ai_score=ai_score,
            ai_insights=ai_insights,
            recommendations=recommendations
        )

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify server is working."""
    return {"message": "Test endpoint working"}

def analyze_complexity(code_content: str, language: str) -> ComplexityAnalysis:
    """Analyze time and space complexity for algorithmic code."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        complexity_prompt = f"""
        Analyze the time and space complexity of this {language} code. Focus on algorithmic efficiency:

        CODE:
        ```{language.lower()}
        {code_content[:1500]}
        ```

        Provide analysis in this format:
        TIME_COMPLEXITY: [e.g., O(n), O(n²), O(log n), O(1)]
        SPACE_COMPLEXITY: [e.g., O(n), O(1), O(log n)]
        OPTIMIZATION_LEVEL: [Optimal/Good/Average/Poor/Brute Force]
        COMPLEXITY_SCORE: [0-100 based on efficiency]
        EXPLANATION: [Brief explanation]
        """

        # Generate content with implicit timeout from model
        response = model.generate_content(complexity_prompt)
        response_text = response.text

        # Parse response
        time_complexity = "O(n)"
        space_complexity = "O(1)"
        optimization_level = "Average"
        complexity_score = 50
        explanation = "Complexity analysis not available"

        for line in response_text.split('\n'):
            if line.startswith('TIME_COMPLEXITY:'):
                time_complexity = line.split('TIME_COMPLEXITY:')[1].strip()
            elif line.startswith('SPACE_COMPLEXITY:'):
                space_complexity = line.split('SPACE_COMPLEXITY:')[1].strip()
            elif line.startswith('OPTIMIZATION_LEVEL:'):
                optimization_level = line.split('OPTIMIZATION_LEVEL:')[1].strip()
            elif line.startswith('COMPLEXITY_SCORE:'):
                try:
                    complexity_score = int(line.split('COMPLEXITY_SCORE:')[1].strip())
                except:
                    complexity_score = 50
            elif line.startswith('EXPLANATION:'):
                explanation = line.split('EXPLANATION:')[1].strip()

        return ComplexityAnalysis(
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            optimization_level=optimization_level,
            complexity_score=complexity_score,
            explanation=explanation
        )

    except Exception as e:
        return ComplexityAnalysis(
            time_complexity="Unknown",
            space_complexity="Unknown",
            optimization_level="Unknown",
            complexity_score=50,
            explanation=f"Complexity analysis failed: {str(e)}"
        )

def analyze_code_quality(code_content: str, language: str) -> CodeQualityMetrics:
    """Analyze code quality metrics without execution."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        quality_prompt = f"""
        Analyze the code quality of this {language} code:

        CODE:
        ```{language.lower()}
        {code_content[:1500]}
        ```

        Evaluate and score (0-100) these aspects:
        SYNTAX_SCORE: [0-100] - Syntax correctness and language idioms
        READABILITY_SCORE: [0-100] - Variable names, comments, structure, clarity
        MAINTAINABILITY_SCORE: [0-100] - Modularity, organization, reusability
        DUPLICATE_CODE_PENALTY: [0-50] - Points to deduct for code duplication
        BEST_PRACTICES_SCORE: [0-100] - Following language-specific best practices
        OVERALL_QUALITY_SCORE: [0-100] - Overall code quality assessment
        """

        response = model.generate_content(quality_prompt)
        response_text = response.text

        # Default scores
        syntax_score = 80
        readability_score = 70
        maintainability_score = 70
        duplicate_code_penalty = 0
        best_practices_score = 70
        overall_quality_score = 70

        for line in response_text.split('\n'):
            if line.startswith('SYNTAX_SCORE:'):
                try:
                    syntax_score = int(line.split('SYNTAX_SCORE:')[1].strip())
                except:
                    pass
            elif line.startswith('READABILITY_SCORE:'):
                try:
                    readability_score = int(line.split('READABILITY_SCORE:')[1].strip())
                except:
                    pass
            elif line.startswith('MAINTAINABILITY_SCORE:'):
                try:
                    maintainability_score = int(line.split('MAINTAINABILITY_SCORE:')[1].strip())
                except:
                    pass
            elif line.startswith('DUPLICATE_CODE_PENALTY:'):
                try:
                    duplicate_code_penalty = int(line.split('DUPLICATE_CODE_PENALTY:')[1].strip())
                except:
                    pass
            elif line.startswith('BEST_PRACTICES_SCORE:'):
                try:
                    best_practices_score = int(line.split('BEST_PRACTICES_SCORE:')[1].strip())
                except:
                    pass
            elif line.startswith('OVERALL_QUALITY_SCORE:'):
                try:
                    overall_quality_score = int(line.split('OVERALL_QUALITY_SCORE:')[1].strip())
                except:
                    pass

        return CodeQualityMetrics(
            syntax_score=min(100, max(0, syntax_score)),
            readability_score=min(100, max(0, readability_score)),
            maintainability_score=min(100, max(0, maintainability_score)),
            duplicate_code_penalty=min(50, max(0, duplicate_code_penalty)),
            best_practices_score=min(100, max(0, best_practices_score)),
            overall_quality_score=min(100, max(0, overall_quality_score))
        )

    except Exception as e:
        return CodeQualityMetrics(
            syntax_score=70,
            readability_score=70,
            maintainability_score=70,
            duplicate_code_penalty=0,
            best_practices_score=70,
            overall_quality_score=70
        )

def analyze_single_file(file_info: FileInfo, repo_path: str) -> FileAnalysisResult:
    """Analyze a single file comprehensively."""
    try:
        # Read file content
        with open(file_info.path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(file_info.path, 'r', encoding='latin-1') as f:
                content = f.read()
        except Exception:
            content = "Unable to read file content"

    # Execution result (only for executable files)
    execution_result = None
    if file_info.is_executable and file_info.language in ['Python', 'JavaScript', 'Java']:
        execution_result = execute_file(file_info)

    # AI Analysis
    if execution_result:
        ai_score, ai_insights, recommendations = get_ai_analysis(content, execution_result, file_info.language)
    else:
        # For non-executable files, analyze quality only
        quality_metrics = analyze_code_quality(content, file_info.language)
        ai_score = quality_metrics.overall_quality_score
        ai_insights = f"Code quality analysis for {file_info.language} file"
        recommendations = "Focus on code quality and best practices"

    # Complexity Analysis (for algorithmic languages)
    complexity_analysis = None
    if file_info.language in ['Python', 'Java', 'JavaScript', 'C++', 'C', 'Go', 'Rust']:
        complexity_analysis = analyze_complexity(content, file_info.language)
        # Adjust score based on complexity for algorithmic code
        if complexity_analysis.complexity_score < 30:  # Brute force
            ai_score = max(ai_score - 20, 10)
            recommendations += f" Time complexity is {complexity_analysis.time_complexity} which can be optimized."

    # Quality Metrics
    quality_metrics = analyze_code_quality(content, file_info.language)

    # Final score adjustment
    final_score = ai_score
    if complexity_analysis and file_info.language in ['Python', 'Java']:
        # Weight complexity more heavily for algorithmic languages
        final_score = (ai_score * 0.6) + (complexity_analysis.complexity_score * 0.4)

    final_score = min(100, max(0, final_score - quality_metrics.duplicate_code_penalty))

    return FileAnalysisResult(
        file_info=file_info,
        content=content,
        execution_result=execution_result,
        ai_score=final_score,
        complexity_analysis=complexity_analysis,
        quality_metrics=quality_metrics,
        ai_insights=ai_insights,
        recommendations=recommendations,
        analysis_timestamp=time.strftime('%Y-%m-%d %H:%M:%S')
    )

@app.post("/analyze-bulk", response_model=BulkAnalysisResponse)
async def analyze_repository_bulk(request: RepositoryRequest):
    """Analyze ALL files in the repository automatically with timeouts and limits."""
    temp_dir = None

    try:
        # Validate and clean the repository URL
        repo_url = validate_git_url(request.repo_url)

        # Create temporary directory
        temp_dir = tempfile.mkdtemp()
        repo_path = os.path.join(temp_dir, "repo")

        print(f"Starting bulk analysis for: {repo_url}")
        print(f"Branch: {request.branch or 'default'}")
        
        # Clone repository with fallback logic and timeout
        clone_start = time.time()
        try:
            # Only specify branch if it's not empty
            if request.branch and request.branch.strip():
                print(f"Cloning branch: {request.branch}")
                repo = git.Repo.clone_from(repo_url, repo_path, branch=request.branch, depth=1)
            else:
                print("Cloning default branch")
                repo = git.Repo.clone_from(repo_url, repo_path, depth=1)
        except git.exc.GitCommandError as e:
            print(f"Clone failed: {str(e)}")
            # Try master branch if main fails
            if "main" in str(e) and request.branch == "main":
                try:
                    print("Trying master branch...")
                    repo = git.Repo.clone_from(repo_url, repo_path, branch="master", depth=1)
                except git.exc.GitCommandError:
                    # Try without specifying branch
                    try:
                        print("Trying default branch...")
                        repo = git.Repo.clone_from(repo_url, repo_path, depth=1)
                    except git.exc.GitCommandError as final_e:
                        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(final_e)}")
            else:
                # Try without specifying branch
                try:
                    print("Trying default branch...")
                    repo = git.Repo.clone_from(repo_url, repo_path, depth=1)
                except git.exc.GitCommandError as final_e:
                    raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(final_e)}")

        clone_time = time.time() - clone_start
        print(f"Repository cloned successfully in {clone_time:.2f} seconds")
        
        # Find all code files
        print("Scanning for code files...")
        all_files = find_all_code_files(repo_path)
        print(f"Found {len(all_files)} code files")

        if not all_files:
            # Generate repository recommendations
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                recommendation_prompt = f"""
                No code files were found in this repository: {repo_url}

                Please provide recommendations for:
                1. What types of files to add
                2. Suggested project structure
                3. Getting started guide

                Keep it concise and helpful.
                """
                response = model.generate_content(recommendation_prompt)
                recommendations_text = response.text
            except Exception as e:
                print(f"AI recommendation failed: {str(e)}")
                recommendations_text = "Consider adding code files in supported languages (Python, JavaScript, Java, etc.)"

            return BulkAnalysisResponse(
                repository_url=request.repo_url,
                branch=request.branch or "",
                total_files=0,
                analyzed_files=[],
                repository_overview="No code files found in repository",
                overall_repository_score=0.0,
                language_distribution={},
                analysis_summary="Repository contains no analyzable code files",
                top_issues=["No code files found"],
                recommendations=[recommendations_text]
            )

        # Analyze files with limits to prevent timeouts
        max_files = 10  # Reduced from 15 to prevent timeouts
        files_to_analyze = all_files[:max_files]
        analyzed_files = []

        print(f"Analyzing top {len(files_to_analyze)} files (out of {len(all_files)} total)...")
        analysis_start = time.time()

        for i, file_info in enumerate(files_to_analyze):
            print(f"[{i+1}/{len(files_to_analyze)}] Analyzing: {file_info.relative_path}")
            file_start = time.time()
            
            try:
                # Add timeout per file analysis
                analysis_result = analyze_single_file(file_info, repo_path)
                analyzed_files.append(analysis_result)
                
                file_time = time.time() - file_start
                print(f"  ✅ Completed in {file_time:.2f}s - Score: {analysis_result.ai_score:.1f}/100")
                
                # Check total analysis time and break if getting too long
                total_time = time.time() - analysis_start
                if total_time > 120:  # 2 minutes max for all analysis
                    print(f"  ⏰ Analysis timeout reached ({total_time:.1f}s), stopping early")
                    break
                    
            except Exception as e:
                print(f"  ❌ Failed to analyze {file_info.relative_path}: {str(e)}")
                continue

        total_analysis_time = time.time() - analysis_start
        print(f"Analysis completed in {total_analysis_time:.2f} seconds")
        print(f"Successfully analyzed: {len(analyzed_files)}/{len(files_to_analyze)} files")

        # Calculate language distribution
        language_distribution = {}
        for file_info in all_files:
            lang = file_info.language
            language_distribution[lang] = language_distribution.get(lang, 0) + 1

        # Calculate overall repository score
        if analyzed_files:
            total_score = sum(result.ai_score for result in analyzed_files)
            overall_score = total_score / len(analyzed_files)
        else:
            overall_score = 0.0

        print(f"Generating repository overview...")
        
        # Generate repository overview and recommendations with timeout protection
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')

            # Prepare summary data (limit to top 3 files to avoid token limits)
            file_summaries = []
            for result in analyzed_files[:3]:  # Reduced from 5 to 3
                summary = f"- {result.file_info.relative_path} ({result.file_info.language}): Score {result.ai_score:.1f}/100"
                if result.complexity_analysis:
                    summary += f" | Time: {result.complexity_analysis.time_complexity}, Space: {result.complexity_analysis.space_complexity}"
                file_summaries.append(summary)

            overview_prompt = f"""
            Generate a concise repository analysis overview:

            Repository: {repo_url}
            Total Files: {len(all_files)}
            Analyzed Files: {len(analyzed_files)}
            Overall Score: {overall_score:.1f}/100

            Language Distribution: {language_distribution}

            Top Files Analyzed:
            {chr(10).join(file_summaries) if file_summaries else "No files analyzed"}

            Provide (keep responses concise):
            REPOSITORY_OVERVIEW: [1-2 sentences describing the repository]
            ANALYSIS_SUMMARY: [Key findings from the analysis]
            TOP_ISSUES: [3 main issues found] (format as bullet points)
            RECOMMENDATIONS: [3 actionable recommendations] (format as bullet points)
            """

            response = model.generate_content(overview_prompt)
            response_text = response.text

            # Parse response with defaults
            repository_overview = f"Repository contains {len(all_files)} files across {len(language_distribution)} languages with an overall quality score of {overall_score:.1f}/100."
            analysis_summary = f"Successfully analyzed {len(analyzed_files)} out of {len(all_files)} files with varying quality scores."
            top_issues = ["Analysis completed successfully"]
            recommendations = ["Continue improving code quality"]

            current_section = ""
            for line in response_text.split('\n'):
                line = line.strip()
                if line.startswith('REPOSITORY_OVERVIEW:'):
                    repository_overview = line.split('REPOSITORY_OVERVIEW:')[1].strip()
                    current_section = "overview"
                elif line.startswith('ANALYSIS_SUMMARY:'):
                    analysis_summary = line.split('ANALYSIS_SUMMARY:')[1].strip()
                    current_section = "summary"
                elif line.startswith('TOP_ISSUES:'):
                    current_section = "issues"
                    top_issues = []
                elif line.startswith('RECOMMENDATIONS:'):
                    current_section = "recommendations"
                    recommendations = []
                elif line and (line.startswith('-') or line.startswith('•') or line.startswith('*')):
                    if current_section == "issues":
                        top_issues.append(line.lstrip('- •*').strip())
                    elif current_section == "recommendations":
                        recommendations.append(line.lstrip('- •*').strip())

            print(f"Repository overview generated successfully")

        except Exception as e:
            print(f"Failed to generate overview: {str(e)}")
            repository_overview = f"Repository analysis completed for {len(analyzed_files)} files"
            analysis_summary = f"Overall score: {overall_score:.1f}/100"
            top_issues = ["Analysis completed with some limitations"]
            recommendations = ["Continue improving code quality"]

        return BulkAnalysisResponse(
            repository_url=request.repo_url,
            branch=request.branch or "",
            total_files=len(all_files),
            analyzed_files=analyzed_files,
            repository_overview=repository_overview,
            overall_repository_score=overall_score,
            language_distribution=language_distribution,
            analysis_summary=analysis_summary,
            top_issues=top_issues[:5],  # Limit to 5 issues
            recommendations=recommendations[:5]  # Limit to 5 recommendations
        )

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/analyze-bulk-simple")
async def analyze_repository_bulk_simple(request: RepositoryRequest):
    """Simple test version of bulk analysis."""
    return {
        "repository_url": request.repo_url,
        "branch": request.branch,
        "total_files": 0,
        "analyzed_files": [],
        "repository_overview": "Test response",
        "overall_repository_score": 0.0,
        "language_distribution": {},
        "analysis_summary": "Test",
        "top_issues": [],
        "recommendations": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

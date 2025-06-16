import os
import sys
import tempfile
import shutil
import subprocess
import ast
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import git
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Code Evaluator API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005"
    ],  # NextJS dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class RepositoryRequest(BaseModel):
    repo_url: str
    branch: str = "main"

class CodeFile(BaseModel):
    path: str
    content: str
    size: int

class CodeQualityMetrics(BaseModel):
    pylint_score: float
    flake8_issues: int
    complexity_score: int
    lines_of_code: int
    functions_count: int
    classes_count: int

class ExecutionResult(BaseModel):
    success: bool
    output: str
    error: str
    execution_time: float

class FileInfo(BaseModel):
    filename: str
    relative_path: str
    size: int
    language: str
    is_executable: bool

class ComplexityAnalysis(BaseModel):
    time_complexity: str
    space_complexity: str
    cyclomatic_complexity: int

class QualityMetrics(BaseModel):
    maintainability_index: float
    code_duplication: float
    test_coverage: float

class FileAnalysisResult(BaseModel):
    file_info: FileInfo
    complexity_analysis: Optional[ComplexityAnalysis] = None
    quality_metrics: Optional[QualityMetrics] = None
    execution_result: Optional[ExecutionResult] = None
    ai_score: float
    ai_insights: str
    recommendations: str
    analysis_timestamp: str

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

def clone_repository(repo_url: str, branch: str = "main") -> str:
    """Clone a Git repository to a temporary directory."""
    try:
        temp_dir = tempfile.mkdtemp()
        git.Repo.clone_from(repo_url, temp_dir, branch=branch, depth=1)
        return temp_dir
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")

def find_python_files(repo_path: str, max_files: int = 20, max_file_size: int = 50000) -> List[CodeFile]:
    """Find Python files in the repository with limits for performance."""
    python_files = []
    file_count = 0
    
    # Priority order: look for main files first
    priority_files = ['main.py', 'app.py', '__init__.py', 'setup.py']
    found_priority_files = set()
    
    for root, dirs, files in os.walk(repo_path):
        # Skip common directories that don't contain main code
        dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', '.pytest_cache', 'venv', 'env', 'node_modules', '.venv', 'build', 'dist', '.tox']]
        
        # Sort files to prioritize important ones
        py_files = [f for f in files if f.endswith('.py')]
        py_files.sort(key=lambda x: (
            x not in priority_files,  # Priority files first
            'test' in x.lower(),      # Tests last
            x.startswith('_'),        # Private files later
            x
        ))
        
        for file in py_files:
            if file_count >= max_files:
                break
                
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, repo_path)
            
            # Skip test files if we have enough non-test files
            if file_count >= 10 and ('test' in file.lower() or 'test' in relative_path.lower()):
                continue
            
            try:
                # Check file size before reading
                if os.path.getsize(file_path) > max_file_size:
                    print(f"Skipping large file {relative_path} ({os.path.getsize(file_path)} bytes)")
                    continue
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Skip empty or very small files
                if len(content.strip()) < 50:
                    continue
                
                python_files.append(CodeFile(
                    path=relative_path,
                    content=content,
                    size=len(content)
                ))
                
                if file in priority_files:
                    found_priority_files.add(file)
                
                file_count += 1
                
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")
                continue
        
        if file_count >= max_files:
            break
    
    print(f"Found {len(python_files)} Python files (limit: {max_files})")
    return python_files

def analyze_code_quality(file_path: str, content: str, quick_mode: bool = True) -> CodeQualityMetrics:
    """Analyze code quality using AST only for speed."""
    # Skip external tools entirely for speed - just use AST analysis
    complexity_score, loc, functions_count, classes_count = analyze_ast(content)
    
    # Generate a basic pylint-like score based on code structure
    pylint_score = 8.0  # Start with good score
    if complexity_score > 15:
        pylint_score -= 2.0
    if loc > 200:
        pylint_score -= 1.0
    if functions_count == 0 and classes_count == 0:
        pylint_score -= 1.0
    
    pylint_score = max(pylint_score, 0.0)
    
    return CodeQualityMetrics(
        pylint_score=pylint_score,
        flake8_issues=max(0, complexity_score - 5),  # Estimate issues based on complexity
        complexity_score=complexity_score,
        lines_of_code=loc,
        functions_count=functions_count,
        classes_count=classes_count
    )

def run_pylint(file_path: str) -> float:
    """Run pylint and return score."""
    try:
        result = subprocess.run(
            ['pylint', file_path, '--disable=all', '--enable=C,R,W,E', '--score=yes'],
            capture_output=True,
            text=True,
            timeout=15  # Reduced timeout
        )
        
        # Extract score from pylint output
        for line in result.stdout.split('\n'):
            if 'Your code has been rated at' in line:
                score_text = line.split('Your code has been rated at ')[1].split('/')[0]
                return float(score_text)
        
        return 5.0  # Default score if no score found
    except Exception:
        return 5.0

def run_flake8(file_path: str) -> int:
    """Run flake8 and return number of issues."""
    try:
        result = subprocess.run(
            ['flake8', file_path, '--select=E,W,F', '--max-line-length=100'],
            capture_output=True,
            text=True,
            timeout=15  # Reduced timeout
        )
        
        # Count number of issues
        issues = len([line for line in result.stdout.split('\n') if line.strip()])
        return issues
    except Exception:
        return 0

def analyze_ast(content: str) -> tuple:
    """Analyze code using AST for complexity metrics."""
    try:
        tree = ast.parse(content)
        
        lines_of_code = len([line for line in content.split('\n') if line.strip() and not line.strip().startswith('#')])
        
        functions_count = len([node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)])
        classes_count = len([node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)])
        
        # Simple complexity score based on control structures
        complexity_nodes = [ast.If, ast.For, ast.While, ast.Try, ast.With]
        complexity_score = sum(len([node for node in ast.walk(tree) if isinstance(node, node_type)]) 
                             for node_type in complexity_nodes)
        
        return complexity_score, lines_of_code, functions_count, classes_count
    except Exception:
        return 0, 0, 0, 0

def execute_python_file(content: str) -> ExecutionResult:
    """Execute Python code and capture output."""
    try:
        import time
        start_time = time.time()
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Execute the file
            result = subprocess.run(
                [sys.executable, tmp_file_path],
                capture_output=True,
                text=True,
                timeout=10  # 10 second timeout
            )
            
            execution_time = time.time() - start_time
            
            return ExecutionResult(
                success=result.returncode == 0,
                output=result.stdout,
                error=result.stderr,
                execution_time=execution_time
            )
        finally:
            os.unlink(tmp_file_path)
            
    except subprocess.TimeoutExpired:
        return ExecutionResult(
            success=False,
            output="",
            error="Execution timed out after 10 seconds",
            execution_time=10.0
        )
    except Exception as e:
        return ExecutionResult(
            success=False,
            output="",
            error=f"Execution error: {str(e)}",
            execution_time=0.0
        )

def get_gemini_insights(code_content: str, quality_metrics: CodeQualityMetrics, execution_result: Optional[ExecutionResult], quick_mode: bool = True) -> tuple:
    """Get AI insights and scoring from Gemini."""
    # Skip AI for super fast mode - just generate based on metrics
    if quick_mode:
        base_score = min(quality_metrics.pylint_score * 10, 100)
        if quality_metrics.flake8_issues > 5:
            base_score -= 10
        if quality_metrics.complexity_score > 15:
            base_score -= 15
        
        base_score = max(base_score, 30)  # Minimum score
        
        insights = f"Code analysis: {quality_metrics.lines_of_code} lines, {quality_metrics.functions_count} functions, {quality_metrics.classes_count} classes. Complexity: {quality_metrics.complexity_score}. Estimated quality score: {base_score:.0f}/100"
        
        return base_score, insights
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        # Limit code content for faster processing
        code_preview = code_content[:1000]
        
        prompt = f"""
        Analyze this Python code and provide insights:

        Code Preview:
        ```python
        {code_preview}
        ```

        Quality Metrics:
        - Pylint Score: {quality_metrics.pylint_score}/10
        - Flake8 Issues: {quality_metrics.flake8_issues}
        - Complexity Score: {quality_metrics.complexity_score}
        - Lines of Code: {quality_metrics.lines_of_code}
        - Functions: {quality_metrics.functions_count}
        - Classes: {quality_metrics.classes_count}

        Please provide a brief analysis and score (0-100):
        SCORE: [number]
        INSIGHTS: [brief analysis]
        """
        
        response = model.generate_content(prompt)
        
        # Extract score and insights
        response_text = response.text
        lines = response_text.split('\n')
        
        score = 50.0  # Default score
        insights = response_text
        
        for line in lines:
            if line.startswith('SCORE:'):
                try:
                    score = float(line.split('SCORE:')[1].strip())
                except:
                    pass
            elif line.startswith('INSIGHTS:'):
                insights = line.split('INSIGHTS:')[1].strip()
        
        return score, insights
        
    except Exception as e:
        # Generate a basic score based on metrics
        base_score = min(quality_metrics.pylint_score * 10, 100)
        if quality_metrics.flake8_issues > 10:
            base_score -= 20
        if quality_metrics.complexity_score > 20:
            base_score -= 10
        
        base_score = max(base_score, 0)
        
        return base_score, f"Basic analysis: {quality_metrics.lines_of_code} lines, {quality_metrics.functions_count} functions, {quality_metrics.classes_count} classes. Pylint: {quality_metrics.pylint_score}/10"

@app.get("/")
async def root():
    return {"message": "Code Evaluator API is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/analyze", response_model=BulkAnalysisResponse)
async def analyze_repository(request: RepositoryRequest):
    """Analyze a Git repository - alias for evaluate endpoint."""
    return await evaluate_repository(request)

@app.post("/analyze-bulk", response_model=BulkAnalysisResponse)
async def analyze_bulk(request: RepositoryRequest):
    """Bulk analyze all files in a Git repository."""
    # For now, this does the same as regular analyze
    # Could be extended for different behavior in the future
    return await evaluate_repository(request)

@app.post("/evaluate", response_model=BulkAnalysisResponse)
async def evaluate_repository(request: RepositoryRequest):
    """Evaluate a Git repository."""
    temp_dir = None
    
    try:
        from datetime import datetime
        
        # Clone repository
        temp_dir = clone_repository(request.repo_url, request.branch)
        
        # Find Python files (limited for performance)
        python_files = find_python_files(temp_dir, max_files=15, max_file_size=30000)
        
        if not python_files:
            raise HTTPException(status_code=400, detail="No Python files found in repository")
        
        # Analyze each file
        analyzed_files = []
        total_score = 0.0
        language_distribution = {"Python": len(python_files)}
        
        print(f"Analyzing {len(python_files)} Python files...")
        
        for i, file in enumerate(python_files):
            print(f"Analyzing file {i+1}/{len(python_files)}: {file.path}")
            
            # Create FileInfo
            file_info = FileInfo(
                filename=os.path.basename(file.path),
                relative_path=file.path,
                size=file.size,
                language="Python",
                is_executable=file.content.startswith('#!') or 'if __name__ == "__main__"' in file.content
            )
            
            # Quality analysis (quick mode for faster processing)
            quality_metrics_old = analyze_code_quality(file.path, file.content, quick_mode=True)
            
            # Convert to new format
            quality_metrics = QualityMetrics(
                maintainability_index=quality_metrics_old.pylint_score * 10,
                code_duplication=0.0,  # Not implemented yet
                test_coverage=0.0      # Not implemented yet
            )
            
            # Complexity analysis
            complexity_analysis = ComplexityAnalysis(
                time_complexity="O(n)",  # Simplified
                space_complexity="O(1)", # Simplified  
                cyclomatic_complexity=quality_metrics_old.complexity_score
            )
            
            # Code execution (only for small, safe files)
            execution_result = None
            if (file.size < 5000 and 
                not any(danger in file.path.lower() for danger in ['test', 'script', 'run']) and
                not any(danger in file.content.lower() for danger in ['input(', 'open(', 'subprocess', 'os.system'])):
                execution_result = execute_python_file(file.content)
            
            # AI insights (quick mode)
            ai_score, ai_insights = get_gemini_insights(file.content, quality_metrics_old, execution_result, quick_mode=True)
            
            analyzed_files.append(FileAnalysisResult(
                file_info=file_info,
                complexity_analysis=complexity_analysis,
                quality_metrics=quality_metrics,
                execution_result=execution_result,
                ai_score=ai_score,
                ai_insights=ai_insights,
                recommendations="Consider improving code structure and documentation.",
                analysis_timestamp=datetime.now().isoformat()
            ))
            
            total_score += ai_score
        
        # Calculate overall repository score
        overall_score = total_score / len(analyzed_files) if analyzed_files else 0.0
        
        # Generate summary insights
        avg_loc = sum(f.file_info.size for f in analyzed_files) / len(analyzed_files)
        executable_count = sum(1 for f in analyzed_files if f.file_info.is_executable)
        
        analysis_summary = f"Repository analysis complete. {len(python_files)} Python files analyzed (avg {avg_loc:.0f} chars). {executable_count} executable files found. Overall quality score: {overall_score:.1f}/100."
        
        return BulkAnalysisResponse(
            repository_url=request.repo_url,
            branch=request.branch,
            total_files=len(analyzed_files),
            analyzed_files=analyzed_files,
            repository_overview=f"Python repository with {len(analyzed_files)} files analyzed.",
            overall_repository_score=overall_score,
            language_distribution=language_distribution,
            analysis_summary=analysis_summary,
            top_issues=["Consider adding more documentation", "Some files could benefit from refactoring"],
            recommendations=["Add type hints", "Improve test coverage", "Consider code formatting"]
        )
        
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

@app.get("/test")
async def quick_test():
    """Quick test endpoint to verify API is working."""
    sample_code = '''
def hello_world():
    """Simple hello world function."""
    print("Hello, World!")
    return "Hello"

class SimpleClass:
    def __init__(self):
        self.value = 42
    
    def get_value(self):
        return self.value

if __name__ == "__main__":
    hello_world()
'''
    
    # Quick analysis without external dependencies
    quality_metrics = analyze_code_quality("test.py", sample_code, quick_mode=True)
    ai_score, ai_insights = get_gemini_insights(sample_code, quality_metrics, None, quick_mode=True)
    
    return {
        "status": "working",
        "sample_analysis": {
            "quality_metrics": quality_metrics.dict(),
            "ai_score": ai_score,
            "ai_insights": ai_insights
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

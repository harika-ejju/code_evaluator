#!/usr/bin/env python3
"""
Test script for small repository analysis
"""

import tempfile
import shutil
import os
import git
import json
import sys
sys.path.append('.')
from main_runner import find_all_code_files, analyze_single_file

def test_with_simple_repo():
    """Test with a simple repository structure."""
    print("Creating a simple test repository...")
    
    temp_dir = tempfile.mkdtemp()
    repo_path = os.path.join(temp_dir, "test_repo")
    
    try:
        # Create a simple test repository structure
        os.makedirs(repo_path)
        
        # Create several simple files
        files_to_create = [
            ("main.py", """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    print("Fibonacci sequence:")
    for i in range(10):
        print(f"F({i}) = {fibonacci(i)}")

if __name__ == "__main__":
    main()
"""),
            ("calculator.py", """
class Calculator:
    def add(self, a, b):
        return a + b
    
    def subtract(self, a, b):
        return a - b
    
    def multiply(self, a, b):
        return a * b
    
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

# Example usage
if __name__ == "__main__":
    calc = Calculator()
    print(f"5 + 3 = {calc.add(5, 3)}")
    print(f"10 - 4 = {calc.subtract(10, 4)}")
    print(f"6 * 7 = {calc.multiply(6, 7)}")
    print(f"15 / 3 = {calc.divide(15, 3)}")
"""),
            ("utils.py", """
import time

def timer_decorator(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
        return result
    return wrapper

@timer_decorator
def slow_function():
    time.sleep(0.1)
    return "Done!"

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True
""")
        ]
        
        for filename, content in files_to_create:
            file_path = os.path.join(repo_path, filename)
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Created: {filename}")
        
        print(f"\nTest repository created at: {repo_path}")
        
        # Find all code files
        print("\n1. Finding code files...")
        code_files = find_all_code_files(repo_path)
        print(f"Found {len(code_files)} files:")
        for file_info in code_files:
            print(f"  - {file_info.filename} ({file_info.language}) - Priority: {file_info.priority}")
        
        # Analyze each file
        print(f"\n2. Analyzing files...")
        analyzed_files = []
        
        for i, file_info in enumerate(code_files):
            print(f"\nAnalyzing file {i+1}/{len(code_files)}: {file_info.filename}")
            try:
                analysis_result = analyze_single_file(file_info, repo_path)
                analyzed_files.append({
                    "filename": analysis_result.file_info.filename,
                    "language": analysis_result.file_info.language,
                    "ai_score": analysis_result.ai_score,
                    "has_complexity": analysis_result.complexity_analysis is not None,
                    "complexity_score": analysis_result.complexity_analysis.complexity_score if analysis_result.complexity_analysis else None,
                    "time_complexity": analysis_result.complexity_analysis.time_complexity if analysis_result.complexity_analysis else None,
                    "space_complexity": analysis_result.complexity_analysis.space_complexity if analysis_result.complexity_analysis else None,
                    "quality_score": analysis_result.quality_metrics.overall_quality_score,
                    "recommendations_length": len(analysis_result.recommendations)
                })
                print(f"  ✅ Analysis completed - Score: {analysis_result.ai_score:.1f}/100")
                if analysis_result.complexity_analysis:
                    print(f"     Complexity: {analysis_result.complexity_analysis.time_complexity} time, {analysis_result.complexity_analysis.space_complexity} space")
            except Exception as e:
                print(f"  ❌ Analysis failed: {str(e)}")
                analyzed_files.append({
                    "filename": file_info.filename,
                    "error": str(e)
                })
        
        print(f"\n3. Summary:")
        print(f"Total files: {len(code_files)}")
        print(f"Successfully analyzed: {len([f for f in analyzed_files if 'error' not in f])}")
        print(f"Failed analyses: {len([f for f in analyzed_files if 'error' in f])}")
        
        # Calculate overall score
        successful_analyses = [f for f in analyzed_files if 'error' not in f]
        if successful_analyses:
            avg_score = sum(f['ai_score'] for f in successful_analyses) / len(successful_analyses)
            print(f"Average score: {avg_score:.1f}/100")
        
        print(f"\n4. Analysis details:")
        print(json.dumps(analyzed_files, indent=2))
        
        return True, analyzed_files
        
    except Exception as e:
        print(f"Test failed: {str(e)}")
        return False, []
    
    finally:
        # Clean up
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            print(f"\nCleanup completed")

if __name__ == "__main__":
    success, results = test_with_simple_repo()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")

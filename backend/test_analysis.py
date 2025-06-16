#!/usr/bin/env python3
"""
Test script to debug the analysis issue.
"""

import tempfile
import shutil
import os
import git
from main_runner import (
    find_all_code_files, 
    analyze_single_file, 
    analyze_complexity,
    analyze_code_quality,
    get_ai_analysis,
    ExecutionResult
)

def test_simple_analysis():
    """Test the analysis with a simple repository."""
    print("Starting analysis test...")
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    repo_path = os.path.join(temp_dir, "repo")
    
    try:
        # Create a simple test repository locally
        os.makedirs(repo_path)
        
        # Create a simple Python file
        test_file_path = os.path.join(repo_path, "test_file.py")
        with open(test_file_path, 'w') as f:
            f.write("""
def hello_world():
    print("Hello, World!")
    return "success"

if __name__ == "__main__":
    result = hello_world()
    print(f"Result: {result}")
""")
        
        print(f"Created test file at: {test_file_path}")
        
        # Find all code files
        print("Finding code files...")
        code_files = find_all_code_files(repo_path)
        print(f"Found {len(code_files)} files: {[f.filename for f in code_files]}")
        
        if code_files:
            # Test individual analysis components
            test_file = code_files[0]
            print(f"Testing analysis on: {test_file.filename}")
            
            # Read content
            with open(test_file.path, 'r') as f:
                content = f.read()
            print(f"File content length: {len(content)} characters")
            
            # Test complexity analysis
            print("Testing complexity analysis...")
            try:
                complexity = analyze_complexity(content, test_file.language)
                print(f"Complexity result: {complexity}")
            except Exception as e:
                print(f"Complexity analysis error: {str(e)}")
            
            # Test quality analysis
            print("Testing quality analysis...")
            try:
                quality = analyze_code_quality(content, test_file.language)
                print(f"Quality result: {quality}")
            except Exception as e:
                print(f"Quality analysis error: {str(e)}")
            
            # Test AI analysis
            print("Testing AI analysis...")
            try:
                # Create a mock execution result
                execution_result = ExecutionResult(
                    success=True,
                    output="Hello, World!\nResult: success",
                    error="",
                    execution_time=0.1,
                    exit_code=0
                )
                
                score, insights, recommendations = get_ai_analysis(content, execution_result, test_file.language)
                print(f"AI Analysis result:")
                print(f"  Score: {score}")
                print(f"  Insights: {insights[:100]}...")
                print(f"  Recommendations: {recommendations[:100]}...")
            except Exception as e:
                print(f"AI analysis error: {str(e)}")
            
            # Test full file analysis
            print("Testing full file analysis...")
            try:
                full_analysis = analyze_single_file(test_file, repo_path)
                print(f"Full analysis completed successfully")
                print(f"  AI Score: {full_analysis.ai_score}")
                print(f"  Has complexity: {full_analysis.complexity_analysis is not None}")
                print(f"  Has quality metrics: {full_analysis.quality_metrics is not None}")
            except Exception as e:
                print(f"Full analysis error: {str(e)}")
        
    finally:
        # Clean up
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            print("Cleanup completed")

if __name__ == "__main__":
    test_simple_analysis()

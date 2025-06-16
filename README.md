# Code Evaluator AI - Multi-Language Repository Analyzer

## 🚀 Revolutionary Code Analysis Platform

A comprehensive, AI-powered code analysis platform that automatically evaluates ALL files in any Git repository with intelligent scoring, complexity analysis, and optimization recommendations.

![Code Evaluator AI](https://img.shields.io/badge/Code%20Evaluator-AI%20Powered-blue)
![Multi-Language](https://img.shields.io/badge/Languages-15%2B-green)
![Analysis](https://img.shields.io/badge/Analysis-Automated-purple)

## ✨ Key Features

### 🤖 **AI-Powered Analysis**
- Advanced AI evaluation using Google Gemini API
- Intelligent code quality assessment
- Context-aware optimization suggestions
- Repository-wide summary generation

### ⚡ **Multi-Language Support**
- **Primary Languages**: Python, JavaScript, Java, TypeScript
- **Additional Support**: Go, Rust, C/C++, PHP, Ruby, C#, Swift, Kotlin, Scala, R, Shell
- **Web Technologies**: HTML, CSS, SCSS, React, Vue
- **Data Formats**: JSON, XML, YAML, Markdown

### 📊 **Advanced Complexity Analysis**
#### For Python & Java (Algorithmic Focus):
- **Time Complexity**: O(1), O(log n), O(n), O(n²), O(n³) analysis
- **Space Complexity**: Memory usage optimization
- **Optimization Level**: Optimal/Good/Average/Poor/Brute Force
- **Smart Scoring**:
  - O(1) constant: 95-100 points ✅
  - O(log n): 85-94 points ✅
  - O(n) linear: 70-84 points ⚠️
  - O(n²) quadratic: 30-59 points ❌ (-20-30 marks)
  - O(n³) cubic: 10-29 points ❌ (-40-50 marks)
  - Brute force: 5-19 points ❌ (-50+ marks)

#### For Other Languages (Quality Focus):
- **Syntax Correctness**: Language idioms and standards
- **Readability**: Variable naming, comments, structure
- **Maintainability**: Modularity, organization, reusability
- **Best Practices**: Language-specific conventions
- **Code Duplication**: Detection and penalty system
- **Security Considerations**: Static security analysis

### 📈 **Comprehensive Scoring System**
- **Individual File Scores**: 0-100 scale per file
- **Overall Repository Score**: Weighted average across all files
- **Detailed Breakdown**: Quality metrics, complexity analysis, AI insights
- **Mark Reduction Explanations**: Clear reasons for score reductions

### 🔍 **Automatic Analysis Process**
1. **Repository Clone**: Secure Git cloning
2. **File Discovery**: Intelligent code file detection
3. **Language Detection**: Automatic language identification
4. **Code Analysis**: Quality and complexity evaluation
5. **AI Insights**: Gemini-powered recommendations
6. **Report Generation**: Beautiful, interactive results

## Features

- **Repository Analysis**: Clone and analyze Git repositories
- **Code Quality Metrics**: Pylint, Flake8, and complexity analysis
- **Dynamic Testing**: Execute Python files and capture output
- **AI Insights**: Google Gemini AI provides code quality insights and recommendations
- **Professional UI**: Modern, responsive interface built with NextJS and Tailwind CSS

## Tech Stack

### Frontend
- **NextJS 14+** with TypeScript
- **Tailwind CSS** for styling
- **React** for component-based UI

### Backend
- **FastAPI** with Python
- **Google Gemini API** for AI insights
- **GitPython** for repository operations
- **Pylint & Flake8** for code quality analysis
- **AST parsing** for code structure analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git
- Google Gemini API key

### Installation

1. **Setup Backend**
   ```bash
   cd backend
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Configure Environment**
   ```bash
   # Edit backend/.env and add your Gemini API key
   cp backend/.env.example backend/.env
   # Edit the .env file to add: GEMINI_API_KEY=your_actual_api_key
   ```

3. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```
   Backend will run on `http://localhost:8000`

2. **Start the Frontend**

2. **Start the Frontend**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

### API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Usage

1. **Enter Repository URL**: Provide a Git repository URL containing Python files
2. **Select Branch**: Optionally specify a branch (defaults to 'main')
3. **Analyze**: Click "Analyze Repository" to start the evaluation
4. **View Results**: Review code quality metrics, execution results, and AI insights

## Analysis Components

### Code Quality Metrics
- **Pylint Score**: Static analysis score (0-10)
- **Flake8 Issues**: Style and error count
- **Complexity Score**: Control structure complexity
- **Structure Metrics**: Lines of code, functions, classes

### Execution Testing
- **Dynamic Execution**: Runs Python files safely
- **Output Capture**: Records stdout and stderr
- **Performance Metrics**: Execution time tracking
- **Error Handling**: Timeout and error management

### AI Insights
- **Quality Assessment**: Overall code quality scoring
- **Best Practices**: Code structure recommendations
- **Improvement Suggestions**: Specific enhancement advice
- **Pattern Recognition**: Common issues and solutions

## Security Considerations

- Code execution runs in isolated environment
- 10-second timeout for code execution
- File size limits for execution (10KB max)
- No persistent storage of analyzed code
- Temporary directory cleanup

## License

This project is licensed under the MIT License.
# code_evaluator

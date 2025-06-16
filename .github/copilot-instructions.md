# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Code Evaluator project built with NextJS frontend and FastAPI backend that:

1. Accepts Git repository URLs from users
2. Clones repositories and analyzes Python (.py) files
3. Tests code quality and runs Python files
4. Provides scoring and insights using Gemini API
5. Displays results in a professional UI

## Tech Stack:
- Frontend: NextJS 14+ with TypeScript and Tailwind CSS
- Backend: FastAPI with Python
- AI Integration: Google Gemini API
- Code Analysis: AST parsing, pylint, flake8, black
- Git Operations: GitPython library

## Key Features:
- Repository cloning and file extraction
- Static code analysis and quality metrics
- Dynamic code execution with output capture
- AI-powered code insights and scoring
- Professional responsive UI
- Real-time analysis progress updates

## Code Style:
- Use TypeScript for all frontend code
- Follow NextJS 14+ App Router patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states and user feedback
- Follow REST API conventions for backend

# 🚀 Code Evaluator - Setup Guide

## Overview
Professional Python repository analysis tool with AI-powered insights, built with NextJS + FastAPI + Google Gemini AI.

## ⚡ Quick Start (Recommended)

1. **Get Google Gemini API Key**
   - Visit: https://ai.google.dev/
   - Create account and get API key
   - Keep this handy for step 3

2. **One-Command Setup & Run**
   ```bash
   ./start.sh
   ```

3. **Add API Key**
   - The script will prompt you to add your Gemini API key
   - Edit `backend/.env` file and add: `GEMINI_API_KEY=your_key_here`

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🔧 Manual Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- Git
- Google Gemini API key

### Backend Setup
```bash
cd backend
chmod +x setup.sh
./setup.sh

# Configure environment
cp .env.example .env
# Edit .env and add your Gemini API key
```

### Frontend Setup
```bash
npm install
```

### Running Manually
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend
npm run dev
```

## 🧪 Testing the Application

### Sample Repositories (Start Here)
Use the built-in sample repositories in the UI, or try these:

**Small/Fast (Good for testing):**
- https://github.com/psf/requests.git
- https://github.com/pallets/click.git

**Medium (Full features):**
- https://github.com/pallets/flask.git
- https://github.com/python-pillow/Pillow.git

**Large (Comprehensive analysis):**
- https://github.com/Textualize/rich.git
- https://github.com/tiangolo/fastapi.git

### Expected Analysis Time
- Small repos (10-20 files): 30-60 seconds
- Medium repos (50-100 files): 2-5 minutes
- Large repos (100+ files): 5-15 minutes

## 📊 What Gets Analyzed

### Code Quality Metrics
- **Pylint Score**: Static analysis (0-10 scale)
- **Flake8 Issues**: Style and error detection
- **Code Complexity**: Control structure analysis
- **Structure Metrics**: LOC, functions, classes

### Dynamic Analysis
- **Code Execution**: Runs Python files safely
- **Output Capture**: stdout/stderr recording
- **Performance**: Execution time tracking
- **Error Handling**: Timeout protection

### AI Insights
- **Quality Assessment**: Overall scoring (0-100)
- **Best Practices**: Code improvement suggestions
- **Pattern Recognition**: Common issues detection
- **Recommendations**: Specific enhancement advice

## 🛠 Troubleshooting

### Common Issues

**"Import errors" in TypeScript:**
- Restart TypeScript server in VS Code (Ctrl+Shift+P → "TypeScript: Restart TS Server")

**"Connection refused" to backend:**
- Check backend is running: `curl http://localhost:8000`
- Restart backend: `cd backend && source venv/bin/activate && python main.py`

**"API key" errors:**
- Verify `.env` file exists in `backend/` directory
- Check API key is valid at https://ai.google.dev/

**Slow analysis:**
- Start with smaller repositories
- Check internet connection (cloning repos)
- Monitor backend logs for errors

### Clean Reset
```bash
# Reset backend
cd backend
rm -rf venv
./setup.sh

# Reset frontend
rm -rf node_modules package-lock.json
npm install
```

### Performance Tips
1. **Test with small repos first** (< 20 Python files)
2. **Ensure stable internet** (for Git cloning)
3. **Monitor system resources** (analysis is CPU intensive)
4. **Use latest Python/Node versions**

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   NextJS UI     │ => │   FastAPI API    │ => │   Gemini AI     │
│   (Port 3000)   │    │   (Port 8000)    │    │   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Code Analysis   │
                       │ • Git Operations │
                       │ • Pylint/Flake8 │
                       │ • AST Parsing    │
                       │ • Code Execution │
                       └──────────────────┘
```

## 🔒 Security Features

- **Sandboxed execution**: Code runs in isolated environment
- **Timeout protection**: 10-second execution limit
- **File size limits**: Execution limited to small files
- **Temporary storage**: No persistent code storage
- **Clean up**: Automatic temp directory removal

## 📝 Development

- **Frontend**: Edit files in `src/` directory
- **Backend**: Edit files in `backend/` directory
- **Hot reload**: Both frontend and backend support live reloading
- **Debug mode**: Check browser console and terminal output

## 🤝 Support

For issues:
1. Check this guide first
2. Review terminal output for errors
3. Test with sample repositories
4. Check API documentation at http://localhost:8000/docs

---

**Happy Coding! 🎉**

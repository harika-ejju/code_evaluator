# Development Environment Setup

## Quick Start

1. **One-command setup and run:**
   ```bash
   ./start.sh
   ```

2. **Manual setup:**
   ```bash
   # Backend setup
   cd backend
   ./setup.sh
   
   # Add your Gemini API key to backend/.env
   cp .env.example .env
   # Edit .env file with your API key
   
   # Start backend
   source venv/bin/activate
   python main.py
   
   # In another terminal, start frontend
   npm run dev
   ```

## Environment Variables

Create `backend/.env` with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://ai.google.dev/

## Troubleshooting

### Backend Issues
- **Import errors**: Make sure virtual environment is activated
- **Module not found**: Run `pip install -r requirements.txt`
- **API key error**: Check your .env file has correct GEMINI_API_KEY

### Frontend Issues
- **Component errors**: Run `npm install` to install dependencies
- **TypeScript errors**: Check all components are properly exported
- **Connection errors**: Make sure backend is running on port 8000

### Common Solutions
1. **Clean install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Reset backend**:
   ```bash
   cd backend
   rm -rf venv
   ./setup.sh
   ```

## Development Workflow

1. **Code changes**: Edit files in `src/` for frontend, `backend/` for backend
2. **Testing**: Use the web interface to test repository analysis
3. **Debugging**: Check browser console and terminal output
4. **API testing**: Visit http://localhost:8000/docs for API documentation

## Sample Repositories for Testing

Try these public repositories:
- https://github.com/python/cpython.git (large, complex)
- https://github.com/requests/requests.git (well-structured)
- https://github.com/pallets/flask.git (medium complexity)

## Architecture

```
Frontend (NextJS) -> Backend (FastAPI) -> Gemini AI
                  -> Git Operations
                  -> Code Analysis Tools
```

#!/bin/bash

echo "🚀 Starting Code Evaluator Application"
echo "========================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ to continue."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend if not already done
if [ ! -d "backend/venv" ]; then
    echo "🔧 Setting up backend for the first time..."
    cd backend
    chmod +x setup.sh
    ./setup.sh
    cd ..
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found!"
    echo "   Please copy backend/.env.example to backend/.env"
    echo "   and add your Google Gemini API key before running the backend."
fi

echo ""
echo "🎯 Starting application servers..."
echo ""
echo "📝 Instructions:"
echo "   1. Backend will start on http://localhost:8000"
echo "   2. Frontend will start on http://localhost:3000"
echo "   3. Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
echo "🔧 Starting FastAPI backend..."
cd backend
source venv/bin/activate
python main_runner.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️  Starting NextJS frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for user to stop
echo ""
echo "✅ Both servers are starting..."
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT

# Wait for background processes
wait

#!/bin/bash

echo "🚀 Starting JournalDecoded Trading Platform..."

# Start Backend
echo "📊 Starting Backend Server..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "🌐 Starting Frontend Server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Servers Started!"
echo "📊 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🎯 Trading Signals: http://localhost:3000/signals"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT

wait

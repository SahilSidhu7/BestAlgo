#!/bin/bash
set -e

echo "Starting backend server on port 8000..."
cd /app/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend server on port 3000..."
cd /app/frontend
npx serve -s dist -l 3000 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
wait
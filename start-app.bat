@echo off
title AI Prompt Studio Launcher
echo ====================================================
echo 🚀 Starting AI Prompt Studio (Backend + Frontend)...
echo ====================================================

start "AI Prompt Studio - Backend" cmd /k "cd /d %~dp0server && npm run dev"
start "AI Prompt Studio - Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are starting up in separate terminal windows!
echo.
echo 🌐 Frontend Web App: http://localhost:5173  (or http://127.0.0.1:5173)
echo ⚡ Backend API:     http://localhost:5000/api
echo ====================================================
pause

@echo off
echo Starting CareerFit AI Services...
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

start "CareerFit AI Backend (Port 5000)" cmd /k "cd backend && node dist/index.js"
timeout /t 2 /nobreak >nul
start "CareerFit AI Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   CareerFit AI is now running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000/api/v1
echo ========================================================
echo.
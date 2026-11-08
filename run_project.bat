@echo off
title NammaFlood Sentinel Launcher - IBM Bobathon 2026
echo ======================================================================
echo    NAMMAFLOOD SENTINEL -- CIVIC URBAN WATERLOGGING INTELLIGENCE
echo    IBM Bobathon 2026 -- Build for Bengaluru
echo ======================================================================
echo.

echo [1/3] Seeding benchmark Bengaluru urban incidents...
python -m scripts.seed_database
echo.

echo [2/3] Starting FastAPI Multi-Agent Backend on port 8000...
start "NammaFlood Backend (FastAPI)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak > nul

echo [3/3] Starting React Vite Frontend on port 3000...
cd frontend
start "NammaFlood Frontend (Vite React)" cmd /k "npm run dev -- --host 127.0.0.1 --port 3000"
timeout /t 2 /nobreak > nul

echo.
echo Opening NammaFlood Sentinel in your default browser...
start http://localhost:3000
start http://127.0.0.1:8000/docs

echo.
echo ======================================================================
echo Both Backend (port 8000) and Frontend (port 3000) are running!
echo Press any key to exit this launcher window (servers remain running).
echo ======================================================================
pause


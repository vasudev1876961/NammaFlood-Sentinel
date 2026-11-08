# NammaFlood Sentinel PowerShell Launcher
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   NAMMAFLOOD SENTINEL -- CIVIC URBAN WATERLOGGING INTELLIGENCE" -ForegroundColor Cyan
Write-Host "   IBM Bobathon 2026 -- Build for Bengaluru" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Seeding initial Bengaluru urban incidents..." -ForegroundColor Green
python -m scripts.seed_database

Write-Host "`n[2/3] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"
Start-Sleep -Seconds 3

Write-Host "`n[3/3] Launching React Vite Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --host 127.0.0.1 --port 3000"
Start-Sleep -Seconds 2

Write-Host "`nOpening application in default web browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"
Start-Process "http://127.0.0.1:8000/docs"

Write-Host "`nBoth services are running! Enjoy evaluating NammaFlood Sentinel." -ForegroundColor Green


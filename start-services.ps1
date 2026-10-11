# MoSAI Platform Multi-Service Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting MoSAI Food Packaging Optimization Platform   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Python Scientific Microservice
Write-Host "[1/3] Launching Python Scientific Microservice (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd scientific-python; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Node.js Gateway
Write-Host "[2/3] Launching Node.js Orchestration Gateway (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend-node; npm.cmd run dev"

# 3. Start Next.js Frontend
Write-Host "[3/3] Launching Next.js 14 Frontend UI (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev"

Write-Host "`nAll 3 services dispatched!" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "Gateway:   http://localhost:5000/api/health" -ForegroundColor White
Write-Host "Physics:   http://localhost:8000/docs" -ForegroundColor White

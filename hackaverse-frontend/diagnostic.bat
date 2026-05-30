@echo off
REM Frontend Diagnostic Script for HackaVerse
REM This script checks if the frontend is properly configured

echo.
echo ================================================================================
echo                    FRONTEND DIAGNOSTIC SCRIPT
echo ================================================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo [ERROR] Please run this script from the hackaverse-frontend directory
    echo.
    echo Usage:
    echo   cd "c:\Users\pc2\Desktop\sejal task\hackaverse-frontend"
    echo   diagnostic.bat
    echo.
    pause
    exit /b 1
)

echo [CHECK 1] Node.js Installation
echo ================================
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [ERROR] Node.js is not installed!
    echo [FIX] Download from https://nodejs.org/
    pause
    exit /b 1
)
echo.

echo [CHECK 2] npm Installation
echo ================================
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm is installed
    npm --version
) else (
    echo [ERROR] npm is not installed!
    echo [FIX] Install Node.js which includes npm
    pause
    exit /b 1
)
echo.

echo [CHECK 3] Dependencies Installation
echo ================================
if exist "node_modules" (
    echo [OK] node_modules directory exists
    if exist "node_modules\react" (
        echo [OK] React is installed
    ) else (
        echo [WARNING] React not found in node_modules
        echo [FIX] Run: npm install
    )
    if exist "node_modules\vite" (
        echo [OK] Vite is installed
    ) else (
        echo [WARNING] Vite not found in node_modules
        echo [FIX] Run: npm install
    )
) else (
    echo [ERROR] node_modules directory not found!
    echo [FIX] Run: npm install
    pause
    exit /b 1
)
echo.

echo [CHECK 4] Configuration Files
echo ================================
if exist ".env" (
    echo [OK] .env file exists
) else (
    echo [WARNING] .env file not found
    echo [FIX] Create .env file with backend URL
)

if exist "vite.config.js" (
    echo [OK] vite.config.js exists
) else (
    echo [ERROR] vite.config.js not found!
    pause
    exit /b 1
)

if exist "index.html" (
    echo [OK] index.html exists
) else (
    echo [ERROR] index.html not found!
    pause
    exit /b 1
)
echo.

echo [CHECK 5] Source Files
echo ================================
if exist "src\main.jsx" (
    echo [OK] src/main.jsx exists
) else (
    echo [ERROR] src/main.jsx not found!
    pause
    exit /b 1
)

if exist "src\App.jsx" (
    echo [OK] src/App.jsx exists
) else (
    echo [ERROR] src/App.jsx not found!
    pause
    exit /b 1
)
echo.

echo [CHECK 6] Port Availability
echo ================================
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use!
    echo [FIX] Either:
    echo   1. Kill the process using port 3000
    echo   2. Use different port: npm run dev:3001
) else (
    echo [OK] Port 3000 is available
)
echo.

echo [CHECK 7] Backend Connection
echo ================================
echo [INFO] Checking if backend is running...
curl -s http://localhost:8000/system/ready >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running on http://localhost:8000
) else (
    echo [WARNING] Backend is not responding
    echo [FIX] Start backend first:
    echo   cd "c:\Users\pc2\Desktop\sejal task\hackathon"
    echo   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
)
echo.

echo ================================================================================
echo                              SUMMARY
echo ================================================================================
echo.
echo All checks completed!
echo.
echo To start the frontend development server:
echo   npm run dev
echo.
echo Then open browser to:
echo   http://localhost:3000
echo.
echo ================================================================================
echo.
pause

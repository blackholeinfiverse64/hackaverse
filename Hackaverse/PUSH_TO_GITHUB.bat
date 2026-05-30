@echo off
REM ============================================================================
REM HACKAVERSE - PUSH TO GITHUB SCRIPT
REM ============================================================================
REM This script pushes both frontend and backend to:
REM https://github.com/blackholeinfiverse37/Hackaverse.git
REM ============================================================================

setlocal enabledelayedexpansion

set GITHUB_URL=https://github.com/blackholeinfiverse37/Hackaverse.git
set PROJECT_ROOT=c:\Users\pc2\Desktop\sejal task

echo.
echo ============================================================================
echo HACKAVERSE - PUSH TO GITHUB
echo ============================================================================
echo.
echo Target Repository: %GITHUB_URL%
echo.

REM ============================================================================
REM BACKEND PUSH
REM ============================================================================
echo [1/2] Pushing BACKEND...
echo.

cd /d "%PROJECT_ROOT%\hackathon"

if not exist .git (
    echo ERROR: Backend is not a git repository!
    echo Please initialize git first.
    pause
    exit /b 1
)

echo Current branch:
git branch

echo.
echo Pushing backend to %GITHUB_URL%...
git push https://github.com/blackholeinfiverse37/Hackaverse.git main --force

if %errorlevel% neq 0 (
    echo ERROR: Failed to push backend!
    pause
    exit /b 1
)

echo [SUCCESS] Backend pushed!
echo.

REM ============================================================================
REM FRONTEND PUSH
REM ============================================================================
echo [2/2] Pushing FRONTEND...
echo.

cd /d "%PROJECT_ROOT%\hackaverse-frontend"

if not exist .git (
    echo ERROR: Frontend is not a git repository!
    echo Please initialize git first.
    pause
    exit /b 1
)

echo Current branch:
git branch

echo.
echo Pushing frontend to %GITHUB_URL%...
git push https://github.com/blackholeinfiverse37/Hackaverse.git main --force

if %errorlevel% neq 0 (
    echo ERROR: Failed to push frontend!
    pause
    exit /b 1
)

echo [SUCCESS] Frontend pushed!
echo.

REM ============================================================================
REM COMPLETION
REM ============================================================================
echo ============================================================================
echo PUSH COMPLETE!
echo ============================================================================
echo.
echo Both frontend and backend have been pushed to:
echo %GITHUB_URL%
echo.
echo You can verify at:
echo https://github.com/blackholeinfiverse37/Hackaverse
echo.
pause

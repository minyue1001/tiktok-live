@echo off
cd /d "%~dp0"

echo ========================================
echo   TikTok Live Build
echo ========================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Building...
call npm run build

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build complete! Output: dist\
echo ========================================
explorer dist
pause

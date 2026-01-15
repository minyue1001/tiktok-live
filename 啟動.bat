@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Install failed!
        pause
        exit /b 1
    )
)

npm run dev

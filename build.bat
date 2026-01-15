@echo off
chcp 65001 >nul
echo ========================================
echo   TikTok Live - Electron 打包
echo ========================================
echo.

cd /d "%~dp0"

:: 檢查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 找不到 Node.js！
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

:: 檢查 node_modules
if not exist "node_modules" (
    echo [1/2] 安裝依賴套件...
    call npm install
    if errorlevel 1 (
        echo 安裝失敗！
        pause
        exit /b 1
    )
) else (
    echo [1/2] 依賴套件已安裝
)

echo.
echo [2/2] 打包應用程式...
call npm run build

if errorlevel 1 (
    echo 打包失敗！
    pause
    exit /b 1
)

echo.
echo ========================================
echo   打包完成！
echo   輸出位置: dist\
echo ========================================
echo.
dir dist\*.exe 2>nul
pause

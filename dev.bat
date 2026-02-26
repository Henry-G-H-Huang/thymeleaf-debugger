@echo off
chcp 65001 >nul 2>&1
title Thymeleaf Debugger - Dev

echo [INFO] Building project...
call build.bat
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Aborting startup.
    pause
    exit /b 1
)

echo.
echo [INFO] Build passed. Starting server...
call start.bat

@echo off
chcp 65001 >nul 2>&1
title Thymeleaf Debugger - Build

:: Check if Maven is available
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven not found in PATH. Please install Maven first.
    exit /b 1
)

echo [INFO] Compiling project...
call mvn compile -q
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    exit /b 1
)

echo [INFO] Build successful.
exit /b 0

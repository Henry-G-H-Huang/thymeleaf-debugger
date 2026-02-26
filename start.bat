@echo off
chcp 65001 >nul 2>&1
title Thymeleaf Debugger
setlocal enabledelayedexpansion

:: Find available port starting from 8080
set PORT=8080

:find_port
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Port %PORT% is already in use, trying next...
    set /a PORT+=1
    if !PORT! gtr 8099 (
        echo [ERROR] No available port found in range 8080-8099.
        pause
        exit /b 1
    )
    goto find_port
)

echo [INFO] Starting Thymeleaf Debugger on http://localhost:%PORT%
echo [INFO] Press Ctrl+C to stop
echo.

:: Open browser when server is ready (poll port in background)
start "" /min powershell -WindowStyle Hidden -Command "while ($true) { Start-Sleep -Seconds 2; try { $c = New-Object Net.Sockets.TcpClient('127.0.0.1', %PORT%); $c.Close(); Start-Process 'http://localhost:%PORT%'; break } catch {} }"


call mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=%PORT%"

echo.
echo ========================================
echo   Thymeleaf Debugger has stopped.
echo ========================================
pause

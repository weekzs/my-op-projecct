@echo off
chcp 65001 >nul
title Subtitle Summarizer

echo ========================================
echo Subtitle Summarizer - Starting...
echo ========================================
echo.

cd /d "%~dp0"

REM Activate conda environment and run
call conda activate myAuto 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Conda environment 'myAuto' not found, using system Python...
    python main.py
) else (
    echo [OK] Conda environment 'myAuto' activated
    python main.py
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Application failed to start
    echo Press any key to exit...
    pause >nul
)

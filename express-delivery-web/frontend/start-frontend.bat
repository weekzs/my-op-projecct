@echo off
echo Cleaning up previous Node.js processes...

REM Terminate all node.exe processes
for /f "tokens=2" %%i in ('tasklist ^| findstr node.exe') do (
    echo Terminating process: %%i
    taskkill /f /pid %%i >nul 2>&1
)

REM Wait a bit to ensure processes are fully terminated
timeout /t 2 /nobreak >nul

REM Delete Next.js cache
if exist ".next" (
    echo Cleaning Next.js cache...
    rmdir /s /q .next >nul 2>&1
)

echo Starting frontend dev server...
npm run dev
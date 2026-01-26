@echo off
chcp 65001 >nul
echo Cleaning up previous Node.js processes...

REM Terminate all node.exe processes
for /f "tokens=2" %%i in ('tasklist ^| findstr node.exe') do (
    echo Terminating process: %%i
    taskkill /f /pid %%i >nul 2>&1
)

echo Starting backend server...
npx ts-node src/server.ts
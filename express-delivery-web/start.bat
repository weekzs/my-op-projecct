@echo off
chcp 65001 >nul
echo ========================================
echo   快递服务系统 - Windows 启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务...
start "后端服务" cmd /k "cd /d %~dp0backend && start-backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] 启动前端服务...
start "前端服务" cmd /k "cd /d %~dp0frontend && start-frontend.bat"

echo.
echo ========================================
echo   服务启动完成！
echo ========================================
echo 前端地址: http://localhost:3002
echo 后端API: http://localhost:3001
echo.
echo 按任意键关闭此窗口...
pause >nul

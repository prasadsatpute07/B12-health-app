@echo off
:: B12 Backend — Quick Status Check
:: Double-click this file to see service status
echo.
echo ========================================
echo   B12 Backend Service Status
echo ========================================
pm2 list
echo.
echo Checking endpoints...
curl -s http://localhost:3000/health 2>nul && echo.
curl -s http://localhost:8000/health 2>nul && echo.
echo.
pause

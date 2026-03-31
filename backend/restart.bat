@echo off
:: B12 Backend — Restart All Services
echo Restarting B12 Backend services...
pm2 restart all
echo.
pm2 list
pause

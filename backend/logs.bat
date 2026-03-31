@echo off
:: B12 Backend — View Live Logs
:: Press Ctrl+C to exit logs
echo Press Ctrl+C to stop viewing logs.
echo.
pm2 logs --lines 50

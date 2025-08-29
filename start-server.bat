@echo off
echo ========================================
echo    Starting AstralCore Home Server
echo ========================================
echo.

:: Check if dist folder exists
if not exist "dist" (
    echo Building production files first...
    call npm run build
    echo.
)

:: Set environment
set NODE_ENV=production

:: Start the server
echo Starting server on port 3000...
echo.
node server-http.js

pause
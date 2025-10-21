@echo off
setlocal

REM Navigate to project directory
cd /d "C:\Users\TAH57\Desktop\Web\clinic-app"

REM Check if directory change was successful
if not "%CD%"=="C:\Users\TAH57\Desktop\Web\clinic-app" (
    echo ❌ ERROR: Could not navigate to project directory!
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo ========================================
echo   Clinic Application Server Deployment
echo ========================================
echo Current directory: %CD%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    pause
    exit /b 1
)

echo [1/4] Stopping any running instances...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes were running.
) else (
    echo Node.js processes stopped.
)
echo.

echo [2/4] Installing dependencies...
call pnpm install
if errorlevel 1 (
    echo ❌ ERROR: pnpm install failed!
    echo Make sure pnpm is installed: npm install -g pnpm
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully.
echo.

echo [3/4] Building production version...
call pnpm build
if errorlevel 1 (
    echo ❌ ERROR: Build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo ✅ Build completed successfully.
echo.

echo [4/4] Starting server for network access...
echo.
echo ✅ Application will run on:
echo    Local:  http://localhost:3000
echo    Network: http://192.168.58.63:3000
echo.
echo ⚠️  Keep this window open while the server is running!
echo    Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the server without call so it blocks
pnpm run start:network

REM This part only runs after Ctrl+C or if server crashes
echo.
echo.
echo ========================================
echo ✅ Server stopped.
echo ========================================
echo.
pause
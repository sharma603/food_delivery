@echo off
echo ========================================
echo   Redis Setup for Windows
echo ========================================
echo.

echo Checking if Redis is already installed...
redis-cli ping >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Redis is already running!
    goto :configure
)

echo Redis not found. Let's set it up...
echo.

echo Option 1: Download and install Redis manually
echo --------------------------------------------
echo 1. Go to: https://github.com/microsoftarchive/redis/releases
echo 2. Download the latest Redis-x64-*.zip
echo 3. Extract to C:\redis
echo 4. Run: C:\redis\redis-server.exe
echo.

echo Option 2: Install via Chocolatey (if available)
echo ------------------------------------------------
choco --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Chocolatey found! Installing Redis...
    choco install redis-64 -y
    echo ✅ Redis installed! Starting Redis...
    start redis-server
    timeout /t 3 >nul
) else (
    echo ❌ Chocolatey not found. Please install Redis manually.
    echo.
    echo To install Chocolatey:
    echo Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo.
    pause
    exit /b 1
)

:configure
echo.
echo Testing Redis connection...
redis-cli ping
if %errorlevel% == 0 (
    echo ✅ Redis is working!
) else (
    echo ❌ Redis connection failed. Please start Redis manually.
    echo Run: redis-server
    pause
    exit /b 1
)

echo.
echo Configuring environment...
if not exist ".env" (
    echo Creating .env file...
    echo # Redis Configuration > .env
    echo REDIS_URL=redis://localhost:6379 >> .env
    echo ✅ .env file created with Redis configuration
) else (
    echo Updating .env file...
    findstr /C:"REDIS_URL" .env >nul
    if %errorlevel% == 0 (
        echo REDIS_URL already exists in .env
    ) else (
        echo REDIS_URL=redis://localhost:6379 >> .env
        echo ✅ Added REDIS_URL to .env
    )
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo ✅ Redis is running
echo ✅ Environment configured
echo.
echo Next steps:
echo 1. Restart your backend server: npm start
echo 2. You should see "Connected to Redis" in the logs
echo.
pause

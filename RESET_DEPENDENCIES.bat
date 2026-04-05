@echo off
echo ========================================
echo COMPLETE NPM RESET - FIXING CORRUPTED STATE
echo ========================================
echo.

echo WARNING: This will delete node_modules and reinstall everything
echo This may take 3-5 minutes
echo.
pause

echo Step 1/5: Deleting node_modules folder...
if exist node_modules (
    rmdir /s /q node_modules
    echo [DONE] node_modules deleted
) else (
    echo [SKIP] node_modules doesn't exist
)
echo.

echo Step 2/5: Deleting package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo [DONE] package-lock.json deleted
) else (
    echo [SKIP] package-lock.json doesn't exist
)
echo.

echo Step 3/5: Clearing npm cache...
npm cache clean --force
echo [DONE] Cache cleared
echo.

echo Step 4/5: Installing all dependencies (this will take a few minutes)...
npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed!
    echo Try running manually: npm install --legacy-peer-deps
    pause
    exit /b 1
)
echo [DONE] Dependencies installed
echo.

echo Step 5/5: Verifying critical packages...
if exist node_modules\expo-image (
    echo [OK] expo-image
) else (
    echo [MISSING] expo-image
)

if exist node_modules\expo-sensors (
    echo [OK] expo-sensors
) else (
    echo [MISSING] expo-sensors
)

if exist node_modules\expo-speech (
    echo [OK] expo-speech
) else (
    echo [MISSING] expo-speech
)

echo.
echo ========================================
echo RESET COMPLETE!
echo ========================================
echo.
echo You can now run: npm start
echo.
pause

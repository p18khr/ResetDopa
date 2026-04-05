@echo off
echo ========================================
echo FIXING NPM VERSION ERROR
echo ========================================
echo.

echo Step 1/4: Deleting corrupted package-lock.json...
del package-lock.json 2>nul
echo Done!
echo.

echo Step 2/4: Clearing npm cache...
call npm cache clean --force
echo Done!
echo.

echo Step 3/4: Reinstalling all dependencies (this may take 2-3 minutes)...
call npm install
echo Done!
echo.

echo Step 4/4: Checking installation...
if exist node_modules\expo-sensors (
    echo [SUCCESS] expo-sensors installed!
) else (
    echo [WARNING] expo-sensors not found
)

if exist node_modules\expo-speech (
    echo [SUCCESS] expo-speech installed!
) else (
    echo [WARNING] expo-speech not found
)

if exist node_modules\expo-haptics (
    echo [SUCCESS] expo-haptics installed!
) else (
    echo [WARNING] expo-haptics not found
)

echo.
echo ========================================
echo INSTALLATION COMPLETE!
echo ========================================
echo.
echo You can now run: npm start
echo.
pause

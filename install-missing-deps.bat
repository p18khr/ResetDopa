@echo off
echo Installing ALL missing Expo dependencies...
echo.

echo Step 1/4: Installing expo-sensors (for step tracking)
call npx expo install expo-sensors

echo.
echo Step 2/4: Installing expo-speech (for text-to-speech)
call npx expo install expo-speech

echo.
echo Step 3/4: Installing expo-haptics (for haptic feedback)
call npx expo install expo-haptics

echo.
echo Step 4/4: Installing expo-av (for audio)
call npx expo install expo-av

echo.
echo ========================================
echo All dependencies installed!
echo ========================================
echo.
echo Now run: npm start
echo.
pause

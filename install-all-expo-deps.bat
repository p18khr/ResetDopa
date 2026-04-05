@echo off
echo ========================================
echo FINAL FIX - Install ALL Missing Expo Packages
echo ========================================
echo.
echo This will install EVERY missing package at once.
echo No more dependency errors after this!
echo.

echo Installing: expo-image
call npx expo install expo-image

echo.
echo ========================================
echo ALL DEPENDENCIES INSTALLED!
echo ========================================
echo.
echo Starting Expo dev server...
echo.
call npm start

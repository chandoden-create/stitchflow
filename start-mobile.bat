@echo off
title StitchFlow - Mobile App Bundler
echo ========================================================
echo           Starting StitchFlow Mobile Bundler
echo ========================================================
echo.
echo Make sure your phone is connected to the SAME Wi-Fi network!
echo.
cd /d "%~dp0mobile"
npx expo start --web -c
pause

@echo off
title StitchFlow - Backend Server
echo ========================================================
echo           Starting StitchFlow Backend Server
echo ========================================================
echo.
cd /d "%~dp0backend"
npm run start:dev
pause

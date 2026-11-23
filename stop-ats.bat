@echo off
chcp 65001 > nul
title SMARTRECRUIT ATS - Stop
echo ====================================================
echo  🛑 ARRET DE SMARTRECRUIT ATS
echo ====================================================
echo.

echo Arret des processus Node.js et Vite...
taskkill /f /im node.exe 2>nul
echo Arret de PostgreSQL sur port 5433...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5433') do taskkill /f /pid %%a 2>nul

echo.
echo ✅ Tous les services ont ete arretes proprement.
pause

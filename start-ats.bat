@echo off
chcp 65001 > nul
title SMARTRECRUIT ATS - Launcher
echo ====================================================
echo  [ATS] LANCEMENT DE SMARTRECRUIT ATS
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/3] Demarrage de PostgreSQL (Port 5433)...
netstat -ano | findstr :5433 > nul
if %errorlevel% neq 0 (
    start "PostgreSQL ATS (Port 5433)" /min "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "%~dp0postgres_data" -p 5433
    ping 127.0.0.1 -n 4 > nul
    echo     OK - PostgreSQL demarre sur le port 5433.
) else (
    echo     OK - PostgreSQL est deja actif sur le port 5433.
)

echo [2/3] Demarrage du Serveur Backend (Port 5000)...
start "SmartRecruit - Backend API" cmd /k "cd /d "%~dp0server" && npm run dev"
ping 127.0.0.1 -n 4 > nul
echo     OK - Backend lance sur http://localhost:5000.

echo [3/3] Demarrage de l'Application Frontend (Port 5173)...
start "SmartRecruit - Frontend React" cmd /k "cd /d "%~dp0client" && npm run dev"
ping 127.0.0.1 -n 4 > nul
echo     OK - Frontend lance sur http://localhost:5173.

echo.
echo ====================================================
echo  [OK] SMARTRECRUIT ATS EST EN LIGNE !
echo  Interface Web : http://localhost:5173
echo  Super Admins : yhykk8899@gmail.com / saadtoufik67@gmail.com
echo ====================================================
echo.
ping 127.0.0.1 -n 3 > nul
start http://localhost:5173



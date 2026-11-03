@echo off
title CampusOne React Frontend
cd /d "%~dp0react_frontend"
echo CampusOne React Frontend
echo.
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm were not found.
  echo Install Node.js LTS, then reopen this file.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing frontend packages for the first time...
  call npm install
  if errorlevel 1 (
    echo Package installation failed.
    pause
    exit /b 1
  )
)
call npm run dev
pause

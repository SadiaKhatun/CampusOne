@echo off
title CampusOne
cd /d "%~dp0"
echo =====================================
echo          CampusOne Launcher
echo =====================================
where py >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3.10 or newer, then try again.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo Creating a local Python environment...
  py -m venv .venv
)
echo Installing the small Flask dependency...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  echo Dependency installation failed. Check internet access and try again.
  pause
  exit /b 1
)
echo Starting CampusOne at http://127.0.0.1:5000
start "" http://127.0.0.1:5000
".venv\Scripts\python.exe" app.py
pause

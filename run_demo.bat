@echo off
cd /d c:\xampp\htdocs\GitContrib

echo Installing dependencies...
.venv\Scripts\pip.exe install -q --upgrade pip
.venv\Scripts\pip.exe install -q -r requirements.txt

echo.
echo ============================================================
echo Starting Quick Start Demo
echo ============================================================
echo.

.venv\Scripts\python.exe scripts\quick_start_demo.py

pause

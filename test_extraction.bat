@echo off
cd /d c:\xampp\htdocs\GitContrib

echo Installing dependencies...
.venv\Scripts\pip.exe install -q --upgrade pip
.venv\Scripts\pip.exe install -q -r requirements.txt

echo.
echo ============================================================
echo Testing Extraction Pipeline
echo ============================================================
echo.

.venv\Scripts\python.exe scripts\test_extraction.py

pause

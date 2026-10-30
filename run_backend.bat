@echo off
cd c:\xampp\htdocs\GitContrib\backend

echo Installing backend dependencies...
..\\.venv\\Scripts\\pip install -q -r requirements.txt

echo.
echo Starting FastAPI backend...
echo Open http://localhost:8000/docs for API docs
echo.

..\\.venv\\Scripts\\uvicorn main:app --reload --reload-dir app --reload-dir ..\\gitcontrib_ml --host 0.0.0.0 --port 8000

pause

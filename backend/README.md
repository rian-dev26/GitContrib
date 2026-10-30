# FastAPI Backend untuk GitContrib

Backend API yang connect ML pipeline ke frontend.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Backend
```bash
# Windows
cd ..
run_backend.bat

# atau manual
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend akan berjalan di `http://localhost:8000`

### 3. API Documentation
Buka `http://localhost:8000/docs` untuk Swagger UI

## API Endpoints

### `POST /api/analyze`
Trigger analysis job pada repository.

**Request:**
```json
{
  "repo_url": "https://github.com/user/repo.git",
  "limit": 500
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "repo_url": "...",
  "repo_name": "repo",
  "status": "pending",
  "progress": 0.0,
  "created_at": "2026-10-30T..."
}
```

### `GET /api/jobs/{job_id}`
Get status job.

**Response:**
```json
{
  "job_id": "uuid",
  "status": "processing|completed|failed",
  "progress": 45.0,
  "error_message": null
}
```

### `GET /api/results/{job_id}`
Get analysis hasil (setelah completed).

**Response:**
```json
{
  "repo_name": "repo",
  "summary": {...},
  "contributors": [
    {
      "author_id": "author_0",
      "name": "Alice",
      "cluster": 0,
      "total_commits": 45
    }
  ],
  "commits": [...]
}
```

### `GET /api/history`
Get semua analysis yang sudah dijalankan.

### `GET /health`
Health check.

## Architecture

```
Frontend (React)
    ↓
FastAPI Backend (main.py)
    ├─ routes.py (API endpoints)
    ├─ extraction.py (call ML pipeline)
    ├─ ml_predictor.py (load trained models)
    ├─ models.py (database schema)
    ├─ database.py (SQLite/PostgreSQL connection)
    ├─ schemas.py (request/response validation)
    └─ config.py (app configuration)
    ↓
ML Pipeline (gitcontrib_ml/)
    ├─ extractor/ (git log parsing)
    ├─ features/ (feature engineering)
    ├─ models/ (clustering + classification)
    └─ labeling.py (auto-label commits)
    ↓
Database (SQLite local / PostgreSQL production)
```

## Database Schema

- `analysis_jobs`: Track job status dan progress
- `analysis_results`: Store hasil analysis
- `contributors`: Detail contributor per analysis
- `commits`: Detail commit per analysis

## Configuration

Default: SQLite database (`gitcontrib.db`)

Untuk production dengan PostgreSQL:
```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/gitcontrib
```

## Docker Deployment

```bash
# Build image
docker build -t gitcontrib-backend .

# Run with compose
docker-compose up -d

# Backend at http://localhost:8000
# Postgres at localhost:5432
```

## Error Handling

- **404**: Job/result not found
- **500**: Analysis failed (lihat logs untuk detail)

Background task akan catch errors dan update job status ke "failed".

## Next Steps

1. Frontend integration: update `analysisService.ts` API base URL ke `http://localhost:8000`
2. Collect dataset untuk training models production-grade
3. Deploy ke production server


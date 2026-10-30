# GitContrib - Detailed Documentation

## 📊 Architecture

```
Frontend (React) → POST /api/analyze → Backend (FastAPI)
                     ↓
            Git Clone + Extract + Predict
                     ↓
            SQLite DB + Background Task
                     ↓
            GET /api/results → Display Dashboard
```

---

## 🤖 Feature Engineering

### Contributor Features (19D)
- **Activity:** commits, active_days, duration, commits_per_day
- **Code:** lines_added, lines_deleted, avg_lines_per_commit
- **Files:** files_touched, unique_dirs
- **Categories:** lines/files in code/test/doc/config
- **Message:** avg_length, median_length

### Commit Features (13D)
- **Text:** message_length, has_body
- **Numeric:** files_changed, lines_added/deleted
- **Flags:** is_merge, is_bot
- **Categories:** has_code_files, has_test_files, etc

---

## 📡 API Reference

### Submit Analysis
```json
POST /api/analyze
{
  "repo_url": "https://github.com/user/repo.git",
  "limit": 500
}

Response:
{
  "job_id": "uuid",
  "status": "pending",
  "progress": 0.0,
  "created_at": "2026-10-30T..."
}
```

### Check Status
```json
GET /api/jobs/{job_id}

Response:
{
  "job_id": "uuid",
  "status": "processing|completed|failed",
  "progress": 45.0
}
```

### Get Results
```json
GET /api/results/{job_id}

Response:
{
  "repo_name": "repo",
  "contributors": [
    {
      "author_id": "author_0",
      "name": "Alice",
      "cluster": 0,
      "total_commits": 45,
      "lines_added": 5200
    }
  ],
  "commits": [...],
  "cluster_distribution": {"0": 1, "1": 2},
  "commit_type_distribution": {"feat": 10, "fix": 5}
}
```

---

## 💾 Database Schema

**analysis_jobs** — Track job status
```
job_id | repo_url | status | progress | error_message | created_at | completed_at
```

**analysis_results** — Store results
```
result_id | job_id | repo_name | n_commits | n_contributors | summary (JSON)
```

**contributors** — Per contributor
```
contributor_id | author_id | name | cluster | total_commits | active_days | lines_added | lines_deleted
```

**commits** — Per commit
```
commit_id | sha | message | author_name | predicted_type | lines_added | lines_deleted
```

---

## 🔧 Configuration

### Backend (.env)
```
DATABASE_URL=sqlite:///./gitcontrib.db
LOG_LEVEL=INFO
```

### Production
```
DATABASE_URL=postgresql://user:password@host:5432/gitcontrib
```

---

## 📊 ML Model Details

### KMeans Clustering
- **Input:** 19 features, scaled with StandardScaler
- **Algorithm:** KMeans (k optimized via Silhouette Score)
- **Output:** Cluster 0-7
- **Metric:** Silhouette Score (target: >0.5)
- **Artifact:** `contributor_scaler.joblib`, `contributor_kmeans.joblib`

### LogisticRegression Classification
- **Input:** TF-IDF (500 features, 1-2grams) + numeric
- **Algorithm:** LogisticRegression (max_iter=200)
- **Output:** Commit type (9 categories)
- **Training:** GroupKFold (group by repo)
- **Metric:** Macro-F1 (target: >0.75)
- **Artifact:** `commit_type_classifier.joblib`

---

## 🧪 Testing

### ML Demo (quick_start_demo.py)
```bash
python scripts/quick_start_demo.py
```
Result:
- Create demo repo (20 commits, 3 authors)
- Extract data
- Build features
- Train clustering + classification
- Display metrics

### Extraction Test (test_extraction.py)
```bash
python scripts/test_extraction.py
```
Result:
- Create repo dummy (4 commits)
- Test extraction
- Validate output

---

## 🚢 Production Deployment

### Prerequisites
- Docker & docker-compose
- PostgreSQL (optional)
- 2GB disk

### Steps
```bash
docker-compose up -d
# Backend: http://localhost:8000
# Postgres: localhost:5432
```

### Monitor
```bash
docker logs -f gitcontrib-backend
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Models not found | Train: `python scripts/train_models.py` |
| Clone timeout | Use limit: `{"limit": 500}` |
| DB error | SQLite auto-creates in folder |
| API 404 | Ensure backend running + CORS |

---

## 📈 Performance

- Extraction: ~500 commits/sec
- Features: ~1000 contributors/sec
- Prediction: <100ms per repo
- Database: SQLite (dev) / PostgreSQL (prod)

---

## 🎓 Important Notes

GitContrib is a **support tool** for deans to understand team activity.

**NOT for:**
- Automatic grading
- Ranking team members
- Replacing manual assessment

---

## 📝 Files Reference

- `gitcontrib_ml/` — ML pipeline (extract, features, models)
- `backend/` — FastAPI (routes, database, integration)
- `src/` — React frontend (pages, components, services)
- `scripts/` — Utilities (demo, collect, train, predict)
- `Dockerfile` — Container specification
- `docker-compose.yml` — Services orchestration
- `MODEL_ARCHITECTURE.md` — Technical deep dive
- `TRAINING_GUIDE.md` — Usage step-by-step

---

**Status:** Production-Ready ✅
**Version:** 1.0.0
**Last Updated:** 2026-10-30

## 🚀 RUN GITCONTRIB LOCALLY - QUICK START

**Total waktu:** 15 menit (first time termasuk install dependencies)

---

## OPTION 1: QUICK TEST (5 MENIT) ⭐ RECOMMENDED FIRST

### Step 1: Buka Command Prompt
```bash
cd c:\xampp\htdocs\GitContrib
```

### Step 2: Jalankan demo
```bash
run_demo.bat
```

**Apa yang terjadi:**
- Create dummy repo (20 commits, 3 authors)
- Extract data
- Build features (19D + 13D)
- Train KMeans + LogisticRegression
- Show results

**Expected:** Selesai dalam 2-3 menit, lihat output analysis.

---

## OPTION 2: FULL STACK (15 MENIT)

### Terminal 1: Backend
```bash
cd c:\xampp\htdocs\GitContrib
run_backend.bat
```

Wait for:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test:** Open http://localhost:8000/docs (Swagger UI)

### Terminal 2: Frontend
```bash
cd c:\xampp\htdocs\GitContrib
npm install    # First time only
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:5173/
```

**Open:** http://localhost:5173

---

## MANUAL TESTING FLOW

### 1️⃣ LOGIN
- Username: `user` (apa saja)
- Password: `pass` (apa saja)
- Click: Login

### 2️⃣ SUBMIT REPO
- URL: `https://github.com/torvalds/linux.git` (atau repo lain)
- Click: "Analyze Repository"
- Lihat job_id dan progress

### 3️⃣ WAIT FOR COMPLETION
- Progress: 0% → 100%
- Status: pending → processing → completed
- Waktu: 2-5 menit (tergantuk repo size)

### 4️⃣ VIEW RESULTS
- Contributor list dengan cluster
- Commit type breakdown chart
- Statistics

### 5️⃣ DOWNLOAD REPORT
- Click "Export"
- Pilih PDF atau CSV
- File download otomatis

### 6️⃣ VIEW HISTORY
- Lihat semua analyses yang pernah dilakukan

### 7️⃣ LOGOUT
- Click "Logout"

---

## API TESTING (CURL)

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=user&password=pass"
# Copy access_token

# 2. Submit analysis
curl -X POST http://localhost:8000/api/analyze \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/user/repo.git"}'
# Copy job_id

# 3. Check status
curl http://localhost:8000/api/jobs/<job_id>
# Tunggu sampai completed

# 4. Get results
curl http://localhost:8000/api/results/<job_id>

# 5. Export PDF
curl http://localhost:8000/api/export/<job_id>?format=pdf > report.pdf

# 6. Export CSV
curl http://localhost:8000/api/export/<job_id>?format=csv > report.csv
```

---

## TROUBLESHOOTING

| Error | Fix |
|-------|-----|
| Port 8000 in use | `netstat -ano \| findstr :8000` → `taskkill /PID <PID> /F` |
| Port 5173 in use | `netstat -ano \| findstr :5173` → `taskkill /PID <PID> /F` |
| git not found | Install from https://git-scm.com/download/win |
| npm not found | Install Node from https://nodejs.org/ |
| DB locked | Delete `gitcontrib.db` dan restart backend |

---

**Next:** Lihat `RUN_LOCALLY_DETAILED.md` untuk panduan lebih lengkap.


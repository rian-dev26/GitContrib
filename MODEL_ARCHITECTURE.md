# GitContrib - Model Architecture

## Dua Model Utama

### Model 1: Contributor Clustering (Unsupervised)

**Tujuan:** Mengelompokkan kontributor berdasarkan pola kontribusi.

**Input:** 19 fitur per kontributor per repo
- Aktivitas: commits, active days, duration
- Kode: lines added/deleted, files touched
- Pola waktu: average hour, message length
- Kategori: persentase code/test/doc/config

**Model:** KMeans dengan k = 2-8
- Optimasi k menggunakan Silhouette Score
- StandardScaler normalisasi fitur

**Output:** 1 label cluster per kontributor
- Contoh: "Core Maintainer", "Occasional", "Test Specialist"

**Metric:** Silhouette Score (target: > 0.5)

---

### Model 2: Commit Type Classification (Supervised)

**Tujuan:** Mengklasifikasi tipe commit (feat/fix/docs/refactor/test/build/ci/chore/revert).

**Input:** 
- Text: commit message subject (TF-IDF: max 500 features, 1-2 grams)
- Numerik: number of files, lines changed, merge flag

**Model:** LogisticRegression dengan TF-IDF vectorizer
- Pipeline: TfidfVectorizer → LogisticRegression

**Training:** 
- GroupKFold (5 folds) grouped by repo (hindari data leak)
- Labels dari conventional commit prefix (auto-generated) + manual (jika ada)

**Output:** 1 label per commit

**Metric:** Macro-F1 Score (target: > 0.75)

---

## Data Pipeline

```
Raw Repository
    ↓
[Extract]
    ├─ git log --all --numstat → commits + files
    ├─ GitHub API → email → username mapping
    └─ Merge identities (fuzzy name matching)
    ↓
Raw Data Frames
    ├─ commits: 900K rows × 9 cols
    └─ files: 2M rows × 6 cols
    ↓
[Clean]
    ├─ Remove bots
    ├─ Classify files (code/test/doc/config)
    ├─ Cap outliers (vendor files)
    └─ Normalize timestamps
    ↓
Cleaned Data
    ↓
[Feature Engineering]
    ├─ Per-contributor aggregations (19 features)
    └─ Per-commit features (13 features)
    ↓
Feature Matrices
    ├─ contrib_features: 1K rows × 19 cols
    └─ commit_features: 900K rows × 13 cols
    ↓
[Auto-Label Commits]
    ├─ Detect conventional commit prefix
    └─ Map to types (feat/fix/docs/...)
    ↓
Labeled Commits
    ↓
[Train Models]
    ├─ Clustering: fit StandardScaler + KMeans
    └─ Classification: fit TfidfVectorizer + LogisticRegression
    ↓
[Artifacts]
    ├─ contributor_scaler.joblib (StandardScaler)
    ├─ contributor_kmeans.joblib (KMeans)
    ├─ commit_type_classifier.joblib (Pipeline)
    └─ metadata.json (hyperparams, metrics)
    ↓
[Production]
    ├─ Load artifacts
    ├─ extract_repository() → new repo data
    ├─ build_features() → feature matrix
    ├─ predict(X) → clusters + commit types
    └─ return JSON result
```

---

## Feature Importance (Clustering)

Top features yang membedakan cluster:
1. `total_commits` - aktivitas volume
2. `lines_added / deleted` - kontribusi code
3. `files_touched` - breadth (ratusan file vs puluhan)
4. `active_days` - consistency (berapa banyak hari aktif)
5. `avg_lines_per_commit` - chunk size (small fixes vs large refactors)
6. `commits_per_active_day` - intensity
7. `files_code / files_test` - specialization ratio

---

## Expected Cluster Profiles

Berdasarkan heuristik di `name_clusters()`:

| Cluster | Karakteristik | Contoh Threshold |
|---|---|---|
| **Core Maintainer** | avg_lines > 500 | High volume, deep changes |
| **Long-term Active** | active_days > 100, commits > 100 | Konsisten jangka panjang |
| **High-frequency** | commits_per_day > 2 | Burst activity, many commits |
| **Steady** | commits_per_day < 0.5, commits < 50 | Slow and steady |
| **Occasional** | total_commits < 10 | Drive-by contributor |

---

## Model Validation

### Clustering Validation
1. **Quantitative:** Silhouette Score pada hold-out test set
2. **Qualitative:** Manual inspection of 50-100 samples
   - Apakah cluster coherent?
   - Apakah meaningful dari domain perspective?

### Classification Validation
1. **Quantitative:** 
   - Macro-F1 via GroupKFold CV
   - Per-class precision/recall
   - Confusion matrix
2. **Manual Review:** 50 commits per class

---

## Hyperparameters

### Clustering
- `n_clusters`: 2-8 (optimasi via silhouette)
- `random_state`: 42 (reproducibility)
- `scaler`: StandardScaler (handles outliers better than MinMaxScaler)

### Classification
- `max_features`: 500 (TF-IDF vocabulary)
- `ngram_range`: (1, 2) (unigram + bigram)
- `min_df`: 2 (ignore ultra-rare words)
- `LogisticRegression max_iter`: 200
- `random_state`: 42

---

## Production Considerations

### Scalability
- Clustering: O(n_samples × n_features × n_clusters) → linear, fast
- Classification: O(n_samples) prediction, TF-IDF lookup is instant

### Monitoring
- Track cluster distribution shift (if >80% in one cluster → model drift)
- Track classification confidence (if <0.6 on avg → needs retraining)
- Log mispredictions for retraining

### Retraining
- Trigger: weekly or when accuracy drops >5%
- Pipeline: collect new data → extract → features → retrain → A/B test → deploy
- Keep model versioning (v1, v2, ...)

---


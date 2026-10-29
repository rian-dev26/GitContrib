"""Train clustering model to identify contributor patterns."""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import joblib
import json


def prepare_clustering_features(features_df: pd.DataFrame) -> tuple:
    """
    Select and scale features for clustering.
    
    Returns:
        - X_scaled: scaled feature matrix
        - feature_names: list of feature column names
        - scaler: fitted StandardScaler
    """
    # Select features (exclude identifiers and derived metrics)
    exclude_cols = ["repo_name", "author_id", "avg_hour", "std_hour"]
    feature_cols = [c for c in features_df.columns if c not in exclude_cols]
    
    X = features_df[feature_cols].fillna(0)
    
    # Handle infinite values
    X = X.replace([np.inf, -np.inf], 0)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, feature_cols, scaler


def find_optimal_k(X_scaled: np.ndarray, k_range: range = range(2, 9)) -> tuple:
    """
    Find optimal number of clusters using silhouette score.
    Skips k values >= n_samples (silhouette requires 2 <= k <= n_samples - 1).
    """
    scores = {}
    n_samples = len(X_scaled)
    
    for k in k_range:
        # Silhouette score needs 2 <= k <= n_samples - 1
        if k >= n_samples:
            print(f"  k={k}: SKIPPED (n_samples={n_samples}, max valid k={n_samples-1})")
            continue
        
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        score = silhouette_score(X_scaled, labels)
        scores[k] = score
        print(f"  k={k}: silhouette={score:.4f}")
    
    if not scores:
        # Fallback: use k=2 even if silhouette can't compute
        print(f"\n→ Using k=2 (insufficient samples for silhouette)")
        return 2, {}
    
    best_k = max(scores, key=scores.get)
    print(f"\n→ Best k: {best_k} (score: {scores[best_k]:.4f})")
    
    return best_k, scores



def train_clustering_model(
    features_df: pd.DataFrame,
    output_dir: Path,
    k_range: range = range(2, 9),
) -> dict:
    """
    Train KMeans clustering model on contributor features.
    
    Returns: model metadata
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("[1/4] Preparing features...")
    X_scaled, feature_cols, scaler = prepare_clustering_features(features_df)
    print(f"      Shape: {X_scaled.shape}")
    
    print("\n[2/4] Finding optimal k...")
    best_k, silhouette_scores = find_optimal_k(X_scaled, k_range=k_range)
    
    print(f"\n[3/4] Training KMeans with k={best_k}...")
    kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    
    print(f"\n[4/4] Saving model artifacts...")
    
    # Assign cluster labels
    features_df["cluster"] = clusters
    
    # Save artifacts
    scaler_path = output_dir / "contributor_scaler.joblib"
    model_path = output_dir / "contributor_kmeans.joblib"
    features_path = output_dir / "contributor_features_with_clusters.parquet"
    metadata_path = output_dir / "contributor_model_metadata.json"
    
    joblib.dump(scaler, scaler_path)
    joblib.dump(kmeans, model_path)
    features_df.to_parquet(features_path, index=False, engine="pyarrow")
    
    # Save metadata
    metadata = {
        "model_type": "KMeans",
        "n_clusters": best_k,
        "n_samples": len(features_df),
        "n_features": len(feature_cols),
        "feature_names": feature_cols,
        "silhouette_score": float(silhouette_scores[best_k]),
        "silhouette_scores_per_k": {str(k): float(v) for k, v in silhouette_scores.items()},
        "cluster_distribution": {
            str(i): int(count) for i, count in enumerate(np.bincount(clusters))
        },
    }
    
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✓ Model trained and saved:")
    print(f"  Scaler: {scaler_path}")
    print(f"  Model:  {model_path}")
    print(f"  Features: {features_path}")
    print(f"  Metadata: {metadata_path}")
    
    return metadata


def name_clusters(kmeans_model, feature_cols: list, scaler) -> dict:
    """
    Name clusters based on centroid inspection.
    
    This is a heuristic approach. In production, domain experts should name them.
    """
    centroids = kmeans_model.cluster_centers_
    X_sample = scaler.inverse_transform(centroids)
    
    cluster_names = {}
    for i, centroid in enumerate(X_sample):
        # Map back to feature space
        metrics = {feat: val for feat, val in zip(feature_cols, centroid)}
        
        # Simple heuristic naming based on metrics
        total_commits = metrics.get("total_commits", 0)
        active_days = metrics.get("active_days", 0)
        avg_lines = metrics.get("avg_lines_per_commit", 0)
        commits_per_day = metrics.get("commits_per_active_day", 0)
        
        if total_commits < 10:
            name = "Occasional Contributor"
        elif commits_per_day < 0.5 and total_commits < 50:
            name = "Steady Contributor"
        elif avg_lines > 500:
            name = "Core Maintainer"
        elif active_days > 100 and total_commits > 100:
            name = "Long-term Active"
        elif commits_per_day > 2:
            name = "High-frequency Contributor"
        else:
            name = f"Cluster {i}"
        
        cluster_names[i] = name
    
    return cluster_names

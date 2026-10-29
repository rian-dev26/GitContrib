"""Train classifier for commit type detection."""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, GroupKFold
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import json


def build_commit_type_pipeline() -> Pipeline:
    """
    Build sklearn pipeline for commit type classification.
    
    Uses TF-IDF on message subject + numeric features.
    """
    # Text features
    text_features = ColumnTransformer([
        ("tfidf", TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
            lowercase=True,
            min_df=2,
        ), "message_subject"),
    ], remainder="passthrough")
    
    # Full pipeline
    pipeline = Pipeline([
        ("features", text_features),
        ("classifier", LogisticRegression(max_iter=200, random_state=42, n_jobs=-1))
    ])
    
    return pipeline


def train_commit_type_model(
    commits_df: pd.DataFrame,
    output_dir: Path,
    test_size: float = 0.2,
) -> dict:
    """
    Train commit type classifier.
    
    Assumes commits_df already has 'commit_type' column from labeling.
    
    Returns: model metadata
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Filter: only labeled commits
    labeled_df = commits_df[commits_df["commit_type"].notna()].copy()
    
    if len(labeled_df) == 0:
        print("ERROR: No labeled commits found")
        return {}
    
    print(f"[1/4] Preparing data...")
    print(f"      Total labeled commits: {len(labeled_df)}")
    print(f"      Distribution:\n{labeled_df['commit_type'].value_counts()}")
    
    # Drop commits with <5 samples (too few for training)
    counts = labeled_df["commit_type"].value_counts()
    valid_types = counts[counts >= 5].index.tolist()
    labeled_df = labeled_df[labeled_df["commit_type"].isin(valid_types)]
    
    print(f"      After filtering: {len(labeled_df)} (removed types with <5 samples)")
    
    X = labeled_df[["message_subject"]].copy()
    y = labeled_df["commit_type"]
    groups = labeled_df["repo_name"].values  # for group k-fold
    
    print(f"\n[2/4] Training model (cross-validation with repo groups)...")
    
    pipeline = build_commit_type_pipeline()
    
    # Group K-Fold to avoid data leak from same repo
    gkf = GroupKFold(n_splits=min(5, len(labeled_df["repo_name"].unique())))
    cv_scores = cross_val_score(
        pipeline, X, y, cv=gkf, groups=groups, scoring="f1_macro", n_jobs=-1
    )
    
    print(f"      Cross-val F1 scores: {cv_scores}")
    print(f"      Mean F1: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    print(f"\n[3/4] Training on full dataset...")
    pipeline.fit(X, y)
    
    print(f"\n[4/4] Saving artifacts...")
    
    model_path = output_dir / "commit_type_classifier.joblib"
    metadata_path = output_dir / "commit_type_model_metadata.json"
    
    joblib.dump(pipeline, model_path)
    
    metadata = {
        "model_type": "LogisticRegression + TF-IDF",
        "n_samples": len(labeled_df),
        "n_classes": len(valid_types),
        "classes": sorted(valid_types),
        "cv_mean_f1": float(cv_scores.mean()),
        "cv_std_f1": float(cv_scores.std()),
        "cross_val_scores": cv_scores.tolist(),
    }
    
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✓ Model trained and saved:")
    print(f"  Model:    {model_path}")
    print(f"  Metadata: {metadata_path}")
    print(f"  CV Mean F1: {cv_scores.mean():.4f}")
    
    return metadata

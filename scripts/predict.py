"""Prediction API: analyze a repository using trained models."""

import sys
from pathlib import Path
import pandas as pd
import joblib
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from gitcontrib_ml.extractor import extract_repository
from gitcontrib_ml.features import build_contributor_features, build_commit_features


class GitContribPredictor:
    """Wrapper for inference on new repositories."""
    
    def __init__(self, models_dir: Path):
        self.models_dir = Path(models_dir)
        
        # Load artifacts
        self.contributor_scaler = joblib.load(
            self.models_dir / "contributor_scaler.joblib"
        )
        self.contributor_kmeans = joblib.load(
            self.models_dir / "contributor_kmeans.joblib"
        )
        self.commit_classifier = joblib.load(
            self.models_dir / "commit_type_classifier.joblib"
        )
        
        # Load metadata
        with open(self.models_dir / "contributor_model_metadata.json") as f:
            self.contributor_metadata = json.load(f)
        
        with open(self.models_dir / "commit_type_model_metadata.json") as f:
            self.commit_metadata = json.load(f)
    
    def analyze_repository(self, repo_path: Path, repo_name: str) -> dict:
        """
        Analyze a repository and return predictions.
        
        Returns:
            {
                "repo_name": str,
                "n_contributors": int,
                "n_commits": int,
                "contributors": [{...}],
                "commits": [{...}],
            }
        """
        # Extract
        commits_df, files_df, identity_map = extract_repository(
            repo_path, Path("/tmp"), repo_name
        )
        
        # Build features
        contrib_features = build_contributor_features(commits_df, files_df)
        commit_features = build_commit_features(commits_df, files_df)
        
        # Predict contributor clusters
        feature_cols = self.contributor_metadata["feature_names"]
        X = contrib_features[feature_cols].fillna(0)
        X_scaled = self.contributor_scaler.transform(X)
        clusters = self.contributor_kmeans.predict(X_scaled)
        
        contrib_features["cluster"] = clusters
        
        # Predict commit types
        commit_preds = self.commit_classifier.predict(commit_features[["message_subject"]])
        commit_features["predicted_type"] = commit_preds
        
        # Format results
        result = {
            "repo_name": repo_name,
            "n_contributors": len(contrib_features),
            "n_commits": len(commits_df),
            "contributors": contrib_features.to_dict(orient="records"),
            "commits": commit_features.to_dict(orient="records"),
            "commit_type_distribution": commit_features["predicted_type"].value_counts().to_dict(),
        }
        
        return result

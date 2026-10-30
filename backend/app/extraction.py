"""Extract repository and format results."""

import sys
from pathlib import Path
import logging

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from gitcontrib_ml.extractor import extract_repository
from gitcontrib_ml.features import build_contributor_features, build_commit_features
from gitcontrib_ml.labeling import auto_label_commits
from app.ml_predictor import get_predictor

logger = logging.getLogger(__name__)


def analyze_repo(repo_path: Path, repo_name: str, limit: int = 0) -> dict:
    """Extract, analyze, predict."""
    logger.info(f"Extracting {repo_name}...")
    commits_df, files_df, identity_map = extract_repository(
        repo_path, Path("/tmp"), repo_name, limit=limit
    )

    logger.info("Building features...")
    contrib_features = build_contributor_features(commits_df, files_df)
    commit_features = build_commit_features(commits_df, files_df)

    logger.info("Labeling...")
    auto_label_commits(commits_df)

    logger.info("Predicting...")
    predictor = get_predictor()

    # Cluster
    import numpy as np
    if predictor.models_loaded and predictor.kmeans is not None:
        try:
            cols = [c for c in contrib_features.columns if c not in ["repo_name", "author_id"]]
            X = contrib_features[cols].fillna(0).replace([np.inf, -np.inf], 0)
            X_scaled = predictor.scaler.transform(X)
            contrib_features["cluster"] = predictor.kmeans.predict(X_scaled)
        except Exception as cluster_err:
            logger.warning(f"Clustering prediction fallback: {cluster_err}")
            contrib_features["cluster"] = 0
    else:
        # Heuristic cluster based on contribution
        contrib_features["cluster"] = 0

    # Commit Type Classification
    if predictor.models_loaded and predictor.classifier is not None:
        try:
            commit_features["predicted_type"] = predictor.classifier.predict(
                commit_features[["message_subject"]]
            )
        except Exception as pred_err:
            logger.warning(f"Classifier prediction fallback to conventional commits: {pred_err}")
            commit_features["predicted_type"] = commits_df["commit_type"].fillna("other")
    else:
        # Rule-based conventional commit classification fallback
        commit_features["predicted_type"] = commits_df["commit_type"].fillna("other")

    return format_result(commits_df, contrib_features, commit_features, identity_map)


def format_result(commits_df, contrib_features, commit_features, identity_map):
    """Format for API response."""
    contributors = []
    for _, row in contrib_features.iterrows():
        cid = row["author_id"]
        contributors.append({
            "author_id": cid,
            "name": identity_map.get(cid, {}).get("canonical_name", cid),
            "email": identity_map.get(cid, {}).get("canonical_email", ""),
            "cluster": int(row.get("cluster", 0)),
            "total_commits": int(row.get("total_commits", 0)),
            "active_days": int(row.get("active_days", 0)),
            "lines_added": int(row.get("lines_added", 0)),
            "lines_deleted": int(row.get("lines_deleted", 0)),
        })

    commits = []
    for _, row in commit_features.iterrows():
        author_id = row.get("author_id", "")
        author_name = identity_map.get(author_id, {}).get("canonical_name", author_id)

        commits.append({
            "sha": row["sha"][:8],
            "message": row.get("message_subject", ""),
            "author": author_name,
            "type": row.get("predicted_type", "unknown"),
            "lines_added": int(row.get("lines_added_commit", 0)),
            "lines_deleted": int(row.get("lines_deleted_commit", 0)),
        })

    return {
        "repo_name": commits_df["repo_name"].iloc[0] if len(commits_df) > 0 else "?",
        "n_commits": len(commits_df),
        "n_contributors": len(contributors),
        "contributors": contributors,
        "commits": commits[:100],
        "cluster_dist": contrib_features["cluster"].value_counts().to_dict(),
        "type_dist": commit_features["predicted_type"].value_counts().to_dict(),
    }

"""Feature engineering for contributor analysis."""

import pandas as pd
import numpy as np
from datetime import datetime, timezone


def build_contributor_features(commits_df: pd.DataFrame, files_df: pd.DataFrame) -> pd.DataFrame:
    """
    Build contributor-level features from commits and files.
    
    Returns DataFrame with rows per (repo_name, author_id) and feature columns.
    """
    # Exclude bots
    is_bot = commits_df["is_bot"] if "is_bot" in commits_df.columns else False
    commits_clean = commits_df[~is_bot].copy()
    if len(commits_clean) == 0:
        commits_clean = commits_df.copy()

    # Align files with clean commits
    files_clean = files_df[files_df["sha"].isin(commits_clean["sha"])].copy()
    
    # Parse dates
    commits_clean["author_datetime"] = pd.to_datetime(commits_clean["author_date"], errors="coerce", utc=True)
    commits_clean["commit_datetime"] = pd.to_datetime(commits_clean["commit_date"], errors="coerce", utc=True)
    
    features_list = []
    
    for (repo, author_id), group in commits_clean.groupby(["repo_name", "author_id"]):
        features = {"repo_name": repo, "author_id": author_id}
        
        # Basic counts
        features["total_commits"] = len(group)
        features["merge_commits"] = group["is_merge"].sum() if "is_merge" in group.columns else 0
        features["regular_commits"] = features["total_commits"] - features["merge_commits"]
        
        # Time-based
        valid_dates = group["author_datetime"].dropna()
        if len(valid_dates) > 0:
            dates = valid_dates.dt.date
            features["active_days"] = dates.nunique()
            first_commit = valid_dates.min()
            last_commit = valid_dates.max()
            duration = (last_commit - first_commit).days + 1
            features["duration_days"] = max(duration, 1)
            features["commits_per_active_day"] = features["total_commits"] / max(features["active_days"], 1)
        else:
            features["active_days"] = 1
            features["duration_days"] = 1
            features["commits_per_active_day"] = float(features["total_commits"])
        
        # Lines of code
        author_files = files_clean[files_clean["author_id"] == author_id]
        features["lines_added"] = author_files["lines_added"].sum() if "lines_added" in author_files.columns else 0
        features["lines_deleted"] = author_files["lines_deleted"].sum() if "lines_deleted" in author_files.columns else 0
        features["total_lines_changed"] = features["lines_added"] + features["lines_deleted"]
        
        if features["regular_commits"] > 0:
            features["avg_lines_per_commit"] = features["total_lines_changed"] / features["regular_commits"]
        else:
            features["avg_lines_per_commit"] = 0
        
        # Files touched
        if "file_path" in author_files.columns:
            features["files_touched"] = author_files["file_path"].nunique()
            features["unique_dirs"] = author_files["file_path"].apply(
                lambda x: str(x).rsplit("/", 1)[0] if "/" in str(x) else "root"
            ).nunique()
        else:
            features["files_touched"] = 0
            features["unique_dirs"] = 0
        
        # File categories
        for category in ["code", "test", "doc", "config"]:
            if "file_category" in author_files.columns:
                cat_files = author_files[author_files["file_category"] == category]
                features[f"lines_{category}"] = cat_files["lines_added"].sum() if "lines_added" in cat_files.columns else 0
                features[f"files_{category}"] = cat_files["file_path"].nunique() if "file_path" in cat_files.columns else 0
            else:
                features[f"lines_{category}"] = 0
                features[f"files_{category}"] = 0
        
        # Time patterns (hour of day per author group)
        if len(valid_dates) > 0:
            hours = valid_dates.dt.hour
            features["avg_hour"] = float(hours.mean())
            features["std_hour"] = float(hours.std()) if len(hours) > 1 else 0.0
        else:
            features["avg_hour"] = 12.0
            features["std_hour"] = 0.0
        
        # Commit message length
        if "message_subject" in group.columns:
            msg_lengths = group["message_subject"].astype(str).str.len()
            features["avg_msg_length"] = float(msg_lengths.mean())
            features["median_msg_length"] = float(msg_lengths.median())
        else:
            features["avg_msg_length"] = 0.0
            features["median_msg_length"] = 0.0
        
        features_list.append(features)
    
    return pd.DataFrame(features_list)


def build_commit_features(commits_df: pd.DataFrame, files_df: pd.DataFrame) -> pd.DataFrame:
    """
    Build commit-level features for commit type classification.
    
    Returns DataFrame with one row per commit and feature columns.
    """
    features_list = []
    
    for _, commit in commits_df.iterrows():
        sha = commit["sha"]
        commit_files = files_df[files_df["sha"] == sha] if "sha" in files_df.columns else pd.DataFrame()
        
        subject = str(commit.get("message_subject", ""))
        body = str(commit.get("message_body", ""))
        
        features = {
            "sha": sha,
            "repo_name": commit.get("repo_name", ""),
            "author_id": commit.get("author_id", ""),
            "author_name": commit.get("author_name", ""),
            "message_subject": subject,
            "message_body": body,
            "msg_length": len(subject),
            "has_body": len(body.strip()) > 0,
            "num_files_changed": len(commit_files),
            "lines_added_commit": commit_files["lines_added"].sum() if "lines_added" in commit_files.columns else 0,
            "lines_deleted_commit": commit_files["lines_deleted"].sum() if "lines_deleted" in commit_files.columns else 0,
            "is_merge": bool(commit.get("is_merge", False)),
            "is_bot": bool(commit.get("is_bot", False)),
        }
        
        # File categories in this commit
        for category in ["code", "test", "doc", "config"]:
            if "file_category" in commit_files.columns:
                cat_files = commit_files[commit_files["file_category"] == category]
                features[f"has_{category}_files"] = len(cat_files) > 0
                features[f"num_{category}_files"] = len(cat_files)
            else:
                features[f"has_{category}_files"] = False
                features[f"num_{category}_files"] = 0
        
        features_list.append(features)
    
    return pd.DataFrame(features_list)

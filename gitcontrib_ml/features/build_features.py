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
    commits_clean = commits_df[~commits_df["is_bot"]].copy()
    files_clean = files_df[commits_clean["sha"].isin(commits_df["sha"])].copy()
    
    # Parse dates
    commits_clean["author_datetime"] = pd.to_datetime(commits_clean["author_date"])
    commits_clean["commit_datetime"] = pd.to_datetime(commits_clean["commit_date"])
    
    features_list = []
    
    for (repo, author_id), group in commits_clean.groupby(["repo_name", "author_id"]):
        features = {"repo_name": repo, "author_id": author_id}
        
        # Basic counts
        features["total_commits"] = len(group)
        features["merge_commits"] = group["is_merge"].sum()
        features["regular_commits"] = features["total_commits"] - features["merge_commits"]
        
        # Time-based
        dates = group["author_datetime"].dt.date
        features["active_days"] = dates.nunique()
        
        if len(group) > 0:
            first_commit = group["author_datetime"].min()
            last_commit = group["author_datetime"].max()
            duration = (last_commit - first_commit).days + 1
            features["duration_days"] = max(duration, 1)
            features["commits_per_active_day"] = features["total_commits"] / features["active_days"]
        else:
            features["duration_days"] = 0
            features["commits_per_active_day"] = 0
        
        # Lines of code
        author_files = files_clean[files_clean["author_id"] == author_id]
        features["lines_added"] = author_files["lines_added"].sum()
        features["lines_deleted"] = author_files["lines_deleted"].sum()
        features["total_lines_changed"] = features["lines_added"] + features["lines_deleted"]
        
        if features["regular_commits"] > 0:
            features["avg_lines_per_commit"] = features["total_lines_changed"] / features["regular_commits"]
        else:
            features["avg_lines_per_commit"] = 0
        
        # Files touched
        features["files_touched"] = author_files["file_path"].nunique()
        features["unique_dirs"] = author_files["file_path"].apply(
            lambda x: x.rsplit("/", 1)[0] if "/" in x else "root"
        ).nunique()
        
        # File categories
        for category in ["code", "test", "doc", "config"]:
            cat_files = author_files[author_files["file_category"] == category]
            features[f"lines_{category}"] = cat_files["lines_added"].sum()
            features[f"files_{category}"] = cat_files["file_path"].nunique()
        
        # Time patterns (basic - hour of day from ISO timestamp)
        hours = commits_clean["author_datetime"].dt.hour
        features["avg_hour"] = hours.mean()
        features["std_hour"] = hours.std() if len(hours) > 1 else 0
        
        # Commit message length
        msg_lengths = group["message_subject"].str.len()
        features["avg_msg_length"] = msg_lengths.mean()
        features["median_msg_length"] = msg_lengths.median()
        
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
        commit_files = files_df[files_df["sha"] == sha]
        
        features = {
            "sha": sha,
            "repo_name": commit["repo_name"],
            "author_id": commit["author_id"],
            "message_subject": commit["message_subject"],
            "message_body": commit["message_body"],
            "msg_length": len(commit["message_subject"]),
            "has_body": len(commit["message_body"].strip()) > 0,
            "num_files_changed": len(commit_files),
            "lines_added_commit": commit_files["lines_added"].sum(),
            "lines_deleted_commit": commit_files["lines_deleted"].sum(),
            "is_merge": commit["is_merge"],
            "is_bot": commit.get("is_bot", False),
        }
        
        # File categories in this commit
        for category in ["code", "test", "doc", "config"]:
            cat_files = commit_files[commit_files["file_category"] == category]
            features[f"has_{category}_files"] = len(cat_files) > 0
            features[f"num_{category}_files"] = len(cat_files)
        
        features_list.append(features)
    
    return pd.DataFrame(features_list)

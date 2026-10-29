"""End-to-end training script: extract -> features -> train models."""

import sys
from pathlib import Path
import pandas as pd
import argparse

sys.path.insert(0, str(Path(__file__).parent.parent))

from gitcontrib_ml.features import build_contributor_features, build_commit_features
from gitcontrib_ml.models import train_clustering_model, train_commit_type_model


def main():
    parser = argparse.ArgumentParser(description="Train AI models")
    parser.add_argument("--commits", type=str, required=True,
                       help="Path to all_commits.parquet")
    parser.add_argument("--files", type=str, required=True,
                       help="Path to all_files.parquet")
    parser.add_argument("--models-dir", type=str, default="models/artifacts",
                       help="Output directory for trained models")
    parser.add_argument("--k-range", type=str, default="2,3,4,5,6,7,8",
                       help="Range of k values to try for clustering (comma-separated)")
    
    args = parser.parse_args()
    
    commits_path = Path(args.commits)
    files_path = Path(args.files)
    models_dir = Path(args.models_dir)
    
    if not commits_path.exists() or not files_path.exists():
        print("ERROR: Commits or files parquet not found")
        return 1
    
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print("Loading data...")
    commits_df = pd.read_parquet(commits_path)
    files_df = pd.read_parquet(files_path)
    
    print(f"Commits: {len(commits_df)}")
    print(f"Files: {len(files_df)}")
    print(f"Repos: {commits_df['repo_name'].nunique()}")
    
    # Build contributor features for clustering
    print("\n" + "="*60)
    print("BUILDING CONTRIBUTOR FEATURES FOR CLUSTERING")
    print("="*60 + "\n")
    
    contrib_features_df = build_contributor_features(commits_df, files_df)
    print(f"Built features for {len(contrib_features_df)} contributors")
    print(f"Features: {contrib_features_df.shape[1]} dimensions")
    
    # Train clustering model
    print("\n" + "="*60)
    print("TRAINING CLUSTERING MODEL")
    print("="*60 + "\n")
    
    k_range_list = list(map(int, args.k_range.split(",")))
    k_range = range(min(k_range_list), max(k_range_list) + 1)
    
    cluster_metadata = train_clustering_model(
        contrib_features_df,
        models_dir,
        k_range=k_range
    )
    
    # Build commit features for classification
    print("\n" + "="*60)
    print("BUILDING COMMIT FEATURES FOR CLASSIFICATION")
    print("="*60 + "\n")
    
    commit_features_df = build_commit_features(commits_df, files_df)
    print(f"Built features for {len(commit_features_df)} commits")
    
    # Train commit type classifier
    print("\n" + "="*60)
    print("TRAINING COMMIT TYPE CLASSIFIER")
    print("="*60 + "\n")
    
    commit_metadata = train_commit_type_model(commit_features_df, models_dir)
    
    print("\n" + "="*60)
    print("✓ ALL MODELS TRAINED SUCCESSFULLY")
    print("="*60)
    print(f"\nModels saved to: {models_dir}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

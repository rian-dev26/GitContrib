"""Script untuk mengumpulkan dataset dari multiple repositories."""

import sys
from pathlib import Path
import pandas as pd
import argparse

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from gitcontrib_ml.extractor import extract_repository
from gitcontrib_ml.features import build_contributor_features, build_commit_features
from gitcontrib_ml.labeling import auto_label_commits


def main():
    parser = argparse.ArgumentParser(description="Collect and process git repositories")
    parser.add_argument("--repos-file", type=str, required=True,
                       help="File with repo URLs (one per line)")
    parser.add_argument("--output-dir", type=str, default="data/raw",
                       help="Output directory for parquet files")
    parser.add_argument("--limit", type=int, default=0,
                       help="Max commits per repo (0=no limit)")
    parser.add_argument("--github-token", type=str, default=None,
                       help="GitHub token for API calls")
    
    args = parser.parse_args()
    
    repos_file = Path(args.repos_file)
    output_dir = Path(args.output_dir)
    
    if not repos_file.exists():
        print(f"ERROR: {repos_file} not found")
        return 1
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read repo list
    with open(repos_file) as f:
        repo_urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    
    print(f"Found {len(repo_urls)} repositories to process\n")
    
    all_commits = []
    all_files = []
    
    for idx, repo_url in enumerate(repo_urls, 1):
        print(f"\n{'='*60}")
        print(f"[{idx}/{len(repo_urls)}] Processing: {repo_url}")
        print(f"{'='*60}")
        
        try:
            # Extract repo name from URL
            repo_name = repo_url.split("/")[-1].replace(".git", "")
            
            # Clone to temp dir (assume already cloned or use extractor with clone)
            repo_path = Path(repo_url)  # TODO: implement clone if needed
            
            if not repo_path.exists():
                print(f"SKIP: {repo_path} not found locally")
                continue
            
            commits_df, files_df, identity_map = extract_repository(
                repo_path, output_dir, repo_name, limit=args.limit,
                github_token=args.github_token
            )
            
            all_commits.append(commits_df)
            all_files.append(files_df)
            
        except Exception as e:
            print(f"ERROR processing {repo_url}: {e}")
            continue
    
    if not all_commits:
        print("\nERROR: No repositories processed successfully")
        return 1
    
    # Combine all data
    print(f"\n{'='*60}")
    print("Combining all repositories...")
    print(f"{'='*60}\n")
    
    combined_commits = pd.concat(all_commits, ignore_index=True)
    combined_files = pd.concat(all_files, ignore_index=True)
    
    print(f"Total commits: {len(combined_commits)}")
    print(f"Total file changes: {len(combined_files)}")
    print(f"Unique contributors: {combined_commits['author_id'].nunique()}")
    
    # Auto-label commits
    print("\nAuto-labeling commits...")
    label_stats = auto_label_commits(combined_commits)
    print(f"Labeled: {label_stats['labeled']} / {label_stats['total']}")
    print(f"Distribution: {label_stats['distribution']}")
    
    # Save combined dataset
    combined_commits_path = output_dir / "all_commits.parquet"
    combined_files_path = output_dir / "all_files.parquet"
    
    combined_commits.to_parquet(combined_commits_path, index=False, engine="pyarrow")
    combined_files.to_parquet(combined_files_path, index=False, engine="pyarrow")
    
    print(f"\n✓ Combined dataset saved:")
    print(f"  Commits: {combined_commits_path}")
    print(f"  Files:   {combined_files_path}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Main extraction pipeline: load commits, merge identities, save to parquet/csv."""

import pandas as pd
from pathlib import Path
from typing import Optional
import logging

from .git_reader import load_raw_commits, get_file_stats
from .identity import fetch_github_usernames
from .merge import merge_identities, save_identity_mapping
from .classify import classify_file, is_bot_author

logger = logging.getLogger(__name__)


def extract_repository(
    repo_path: Path,
    output_dir: Path,
    repo_name: str,
    limit: int = 0,
    github_token: Optional[str] = None,
) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    """
    Extract commits and files from repo.
    
    Returns:
        - commits_df: DataFrame with columns [sha, author_id, author_name, author_email, ...]
        - files_df: DataFrame with columns [sha, author_id, file_path, file_category, ...]
        - identity_map: {author_id: {...}}
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[1/4] Loading commits from {repo_path}...")
    raw_commits = load_raw_commits(repo_path, limit=limit)
    print(f"      Found {len(raw_commits)} commits")
    
    print(f"[2/4] Loading file stats...")
    file_stats = get_file_stats(repo_path, limit=limit)
    print(f"      Found {len(file_stats)} file changes")
    
    print(f"[3/4] Fetching GitHub identities...")
    repo_url = None  # TODO: get from git remote
    gh_email_map = fetch_github_usernames(repo_url, token=github_token)
    
    print(f"[4/4] Merging identities...")
    processed_commits, identity_map = merge_identities(raw_commits, gh_email_map)
    
    # Create commits DataFrame
    commits_df = pd.DataFrame(processed_commits)
    commits_df["repo_name"] = repo_name
    commits_df["is_bot"] = commits_df.apply(
        lambda r: is_bot_author(r["author_name"], r["author_email"]), axis=1
    )
    
    # Create files DataFrame
    files_df = pd.DataFrame(file_stats)
    files_df["file_category"] = files_df["file_path"].apply(classify_file)
    files_df["repo_name"] = repo_name
    
    # Merge author_id into files_df
    author_map = {c["sha"]: c["author_id"] for c in processed_commits}
    files_df["author_id"] = files_df["sha"].map(author_map)
    
    # Save cache / export files (parquet if pyarrow is installed, otherwise fallback to CSV)
    commits_path = output_dir / f"{repo_name}_commits.parquet"
    files_path = output_dir / f"{repo_name}_files.parquet"
    identity_path = output_dir / f"{repo_name}_identity_map.json"
    
    has_pyarrow = False
    try:
        import pyarrow  # noqa: F401
        has_pyarrow = True
    except Exception:
        has_pyarrow = False

    if has_pyarrow:
        try:
            commits_df.to_parquet(commits_path, index=False)
            files_df.to_parquet(files_path, index=False)
            print(f"\n✓ Extraction cache saved (parquet): {commits_path}")
        except Exception as e:
            logger.info(f"Parquet export failed: {e}")
    else:
        try:
            commits_csv = output_dir / f"{repo_name}_commits.csv"
            files_csv = output_dir / f"{repo_name}_files.csv"
            commits_df.to_csv(commits_csv, index=False)
            files_df.to_csv(files_csv, index=False)
            print(f"\n✓ Extraction cache saved (CSV fallback): {commits_csv}")
        except Exception as csv_err:
            logger.debug(f"Disk cache skipped: {csv_err}")
    
    try:
        save_identity_mapping(identity_map, identity_path)
    except Exception as id_err:
        logger.debug(f"Identity map save skipped: {id_err}")
    
    return commits_df, files_df, identity_map

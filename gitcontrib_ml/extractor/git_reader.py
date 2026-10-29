"""Extract raw commit data from git repository using git log --numstat."""

import subprocess
from pathlib import Path
from typing import Optional

FIELD_SEP = "\x1f"
RECORD_SEP = "\x1e"


def run_git(args: list[str], cwd: Optional[Path] = None, timeout: int = 300) -> str:
    """Run git command and return stdout. Raise RuntimeError on failure."""
    full_args = ["git", "-c", "i18n.logOutputEncoding=utf-8"] + args
    result = subprocess.run(
        full_args,
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )
    if result.returncode != 0:
        err = result.stderr.strip() or result.stdout.strip() or "Git command failed."
        raise RuntimeError(err)
    return result.stdout


def load_raw_commits(repo_path: Path, limit: int = 0) -> list[dict]:
    """
    Load raw commit data from git log --all.
    
    Returns list of dicts with keys:
        sha, author_name, author_email, author_date, commit_date,
        message_subject, message_body, parent_count, is_merge
    
    limit=0 means no limit (all commits).
    """
    fmt = FIELD_SEP.join([
        "%H", "%an", "%ae", "%aI", "%cI", "%s", "%b", "%P"
    ]) + RECORD_SEP
    
    args = ["log", "--all", f"--pretty=format:{fmt}"]
    if limit > 0:
        args.insert(2, f"--max-count={limit}")
    
    output = run_git(args, cwd=repo_path)
    records = []
    seen_hashes = set()
    
    for record in output.split(RECORD_SEP):
        record = record.strip("\n")
        if not record:
            continue
        
        parts = record.split(FIELD_SEP, maxsplit=7)
        if len(parts) < 8:
            continue
        
        sha, author_name, author_email, author_date, commit_date, subject, body, parents_str = parts
        sha = sha.strip()
        
        if sha in seen_hashes:
            continue
        seen_hashes.add(sha)
        
        parent_hashes = parents_str.strip().split() if parents_str.strip() else []
        parent_count = len(parent_hashes)
        is_merge = parent_count > 1
        
        records.append({
            "sha": sha,
            "author_name": author_name.strip(),
            "author_email": author_email.strip().lower(),
            "author_date": author_date.strip(),
            "commit_date": commit_date.strip(),
            "message_subject": subject.strip(),
            "message_body": body.strip(),
            "parent_count": parent_count,
            "is_merge": is_merge,
            "parent_hashes": parent_hashes,
        })
    
    return records


def get_file_stats(repo_path: Path, limit: int = 0) -> list[dict]:
    """
    Extract file-level stats via git log --numstat.
    
    Returns list of dicts with keys:
        sha, author_email, author_name, file_path, lines_added, lines_deleted
    """
    fmt = "%H" + FIELD_SEP + "%an" + FIELD_SEP + "%ae" + RECORD_SEP
    
    args = ["log", "--all", "--numstat", "--pretty=format:" + fmt, "--no-renames"]
    if limit > 0:
        args.insert(2, f"--max-count={limit}")
    
    output = run_git(args, cwd=repo_path)
    
    file_stats = []
    current_commit = None
    
    for line in output.split("\n"):
        line = line.rstrip("\r")
        
        if RECORD_SEP in line:
            parts = line.split(FIELD_SEP)
            if len(parts) >= 3:
                current_commit = {
                    "sha": parts[0].strip(),
                    "author_name": parts[1].strip(),
                    "author_email": parts[2].strip().lower(),
                }
            continue
        
        if not line or not current_commit:
            continue
        
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        
        added_str, deleted_str, file_path = parts[0], parts[1], parts[2]
        
        if not file_path.strip():
            continue
        
        added = 0 if added_str == "-" else (int(added_str) if added_str.isdigit() else 0)
        deleted = 0 if deleted_str == "-" else (int(deleted_str) if deleted_str.isdigit() else 0)
        
        file_stats.append({
            "sha": current_commit["sha"],
            "author_email": current_commit["author_email"],
            "author_name": current_commit["author_name"],
            "file_path": file_path.strip(),
            "lines_added": added,
            "lines_deleted": deleted,
        })
    
    return file_stats

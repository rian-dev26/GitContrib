"""Identity merging and GitHub username mapping - Part 1."""

import json
import re
from typing import Optional
import urllib.request


def fetch_github_usernames(repo_url: Optional[str], token: Optional[str] = None) -> dict[str, str]:
    """
    Fetch email -> GitHub username mapping from GitHub API.
    
    Returns dict: {email.lower(): github_username}
    Falls back gracefully if offline, private repo, or rate-limited.
    """
    if not repo_url:
        return {}
    
    match = re.search(r"github\.com[/:]([\\w.\\-]+)/([\\w.\\-]+?)(?:\\.git|/.*)?$", repo_url)
    if not match:
        return {}
    
    owner, repo = match.group(1), match.group(2)
    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100"
    mapping = {}
    
    try:
        headers = {
            "User-Agent": "GitContrib-ML/0.1",
            "Accept": "application/vnd.github.v3+json",
        }
        if token:
            headers["Authorization"] = f"token {token}"
        
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            
            if isinstance(data, list):
                for item in data:
                    commit_info = item.get("commit", {})
                    author_info = item.get("author")
                    
                    if author_info and "login" in author_info:
                        login = author_info["login"]
                        
                        c_author = commit_info.get("author", {})
                        if c_author and "email" in c_author:
                            email = c_author["email"].strip().lower()
                            if email:
                                mapping[email] = login
                        
                        c_committer = commit_info.get("committer", {})
                        if c_committer and "email" in c_committer:
                            email = c_committer["email"].strip().lower()
                            if email and email not in mapping:
                                mapping[email] = login
    except Exception:
        pass
    
    return mapping


def fuzzy_match_names(name1: str, name2: str, threshold: float = 0.85) -> bool:
    """Simple fuzzy match for author names."""
    if name1.lower() == name2.lower():
        return True
    
    s1, s2 = name1.lower(), name2.lower()
    if len(s1) < 3 or len(s2) < 3:
        return False
    
    if s1 in s2 or s2 in s1:
        return True
    
    dist = _levenshtein(s1, s2)
    max_len = max(len(s1), len(s2))
    similarity = 1.0 - (dist / max_len) if max_len > 0 else 0
    
    return similarity >= threshold


def _levenshtein(s1: str, s2: str) -> int:
    """Calculate Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]

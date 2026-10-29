"""Git repository data extraction."""

from .git_reader import load_raw_commits, get_file_stats
from .identity import fetch_github_usernames, fuzzy_match_names
from .merge import merge_identities, save_identity_mapping
from .classify import classify_file, is_bot_author
from .pipeline import extract_repository

__all__ = [
    "load_raw_commits",
    "get_file_stats",
    "fetch_github_usernames",
    "fuzzy_match_names",
    "merge_identities",
    "save_identity_mapping",
    "classify_file",
    "is_bot_author",
    "extract_repository",
]


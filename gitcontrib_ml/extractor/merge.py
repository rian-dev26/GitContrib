"""Merge multiple identities (email/name variants) into canonical authors."""

import json
from pathlib import Path
from .identity import fuzzy_match_names


def merge_identities(
    raw_commits: list[dict],
    gh_email_mapping: dict[str, str],
    name_similarity_threshold: float = 0.85,
) -> tuple[list[dict], dict[str, str]]:
    """
    Merge multiple identities into canonical authors.
    
    Returns:
        - processed_commits: list of dicts with added 'author_id' field
        - identity_mapping: {author_id: {...}}
    """
    email_groups = {}
    for commit in raw_commits:
        email = commit["author_email"]
        if email not in email_groups:
            email_groups[email] = []
        email_groups[email].append(commit)
    
    identity_map = {}
    email_to_author_id = {}
    next_author_id = 0
    processed_emails = set()
    
    for email, commits_with_email in email_groups.items():
        if email in processed_emails:
            continue
        
        names_for_email = set(c["author_name"] for c in commits_with_email)
        canonical_name = max(names_for_email, key=len)
        author_id = f"author_{next_author_id}"
        next_author_id += 1
        
        all_emails = {email}
        all_names = names_for_email
        
        for other_email, other_commits in email_groups.items():
            if other_email in processed_emails or other_email == email:
                continue
            
            other_names = set(c["author_name"] for c in other_commits)
            matches = False
            for n1 in all_names:
                for n2 in other_names:
                    if fuzzy_match_names(n1, n2, threshold=name_similarity_threshold):
                        matches = True
                        break
                if matches:
                    break
            
            if matches:
                all_emails.add(other_email)
                all_names.update(other_names)
                email_to_author_id[other_email] = author_id
                processed_emails.add(other_email)
        
        email_to_author_id[email] = author_id
        processed_emails.add(email)
        
        gh_username = None
        for e in all_emails:
            if e in gh_email_mapping:
                gh_username = gh_email_mapping[e]
                break
        
        identity_map[author_id] = {
            "canonical_name": gh_username or canonical_name,
            "canonical_email": email,
            "emails": sorted(all_emails),
            "names": sorted(all_names),
            "gh_username": gh_username,
        }
    
    processed_commits = []
    for commit in raw_commits:
        commit_copy = commit.copy()
        commit_copy["author_id"] = email_to_author_id.get(
            commit["author_email"], f"author_{next_author_id}"
        )
        processed_commits.append(commit_copy)
    
    return processed_commits, identity_map


def save_identity_mapping(mapping: dict, output_path: Path) -> None:
    """Save identity mapping to JSON for reference/manual correction."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        data = {}
        for author_id, info in mapping.items():
            data[author_id] = {
                "canonical_name": info["canonical_name"],
                "canonical_email": info["canonical_email"],
                "emails": info["emails"],
                "names": info["names"],
                "gh_username": info["gh_username"] or None,
            }
        json.dump(data, f, indent=2, ensure_ascii=False)

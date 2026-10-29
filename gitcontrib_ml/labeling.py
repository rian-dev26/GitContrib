"""Auto-label commits using conventional commit prefix."""

import re
from typing import Optional


def detect_conventional_commit(subject: str, body: str = "") -> Optional[str]:
    """
    Detect conventional commit type from message.
    
    Returns: feat, fix, docs, refactor, perf, test, build, ci, chore, revert, or None
    """
    full_text = (subject + " " + body).lower()
    
    # Pattern: type(scope): description
    match = re.match(r"^(\w+)(\(.+?\))?\s*:", full_text)
    if match:
        commit_type = match.group(1)
        if commit_type in ["feat", "fix", "docs", "refactor", "perf", "test", "build", "ci", "chore", "revert"]:
            return commit_type
    
    # Fallback patterns
    patterns = {
        "fix": [r"\bfix\b", r"\bbugs?\b", r"\bcorrect", r"\bresolve"],
        "feat": [r"\badd\b", r"\bnew\b", r"\bfeature\b", r"\bimlement"],
        "docs": [r"\bdocs?\b", r"\bREADME\b", r"\bdocumentation\b"],
        "refactor": [r"\brefactor\b", r"\bcleanup\b", r"\bremove\b"],
        "test": [r"\btest\b", r"\bspec\b"],
        "build": [r"\bbuild\b", r"\bdeps?\b", r"\bversion\b"],
        "ci": [r"\bci\b", r"\bgithub\b", r"\bworkflow\b"],
        "chore": [r"\bchore\b", r"\brelease\b", r"\bmaintenance\b"],
    }
    
    for commit_type, pattern_list in patterns.items():
        for pattern in pattern_list:
            if re.search(pattern, full_text):
                return commit_type
    
    return None


def auto_label_commits(commits_df) -> dict:
    """
    Auto-label commits dataframe. Return label counts for validation.
    """
    labels = []
    for _, row in commits_df.iterrows():
        label = detect_conventional_commit(
            row.get("message_subject", ""),
            row.get("message_body", "")
        )
        labels.append(label)
    
    commits_df["commit_type"] = labels
    
    return {
        "total": len(labels),
        "labeled": sum(1 for l in labels if l),
        "unlabeled": sum(1 for l in labels if not l),
        "distribution": commits_df["commit_type"].value_counts().to_dict(),
    }

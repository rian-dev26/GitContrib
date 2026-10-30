"""Export to CSV."""

import csv
from io import StringIO
from datetime import datetime


def export_to_csv(analysis_data: dict) -> bytes:
    """Export analysis to CSV format."""
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["GitContrib Analysis Report"])
    writer.writerow(["Repository", analysis_data.get("repo_name", "")])
    writer.writerow(["Generated", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow([])
    
    # Summary
    summary = analysis_data.get("summary", {})
    writer.writerow(["SUMMARY"])
    writer.writerow(["Total Commits", summary.get("total_commits", 0)])
    writer.writerow(["Total Contributors", summary.get("total_contributors", 0)])
    writer.writerow(["Total Lines Added", summary.get("total_lines_added", 0)])
    writer.writerow(["Total Lines Deleted", summary.get("total_lines_deleted", 0)])
    writer.writerow([])
    
    # Contributors
    writer.writerow(["CONTRIBUTORS"])
    writer.writerow(["Author ID", "Name", "Cluster", "Commits", "Active Days", "Lines Added", "Lines Deleted"])
    for contrib in analysis_data.get("contributors", []):
        writer.writerow([
            contrib.get("author_id", ""),
            contrib.get("name", ""),
            contrib.get("cluster", ""),
            contrib.get("total_commits", 0),
            contrib.get("active_days", 0),
            contrib.get("lines_added", 0),
            contrib.get("lines_deleted", 0),
        ])
    writer.writerow([])
    
    # Commits
    writer.writerow(["COMMITS (Top 50)"])
    writer.writerow(["SHA", "Author", "Type", "Lines Added", "Lines Deleted", "Files Changed"])
    for commit in analysis_data.get("commits", [])[:50]:
        writer.writerow([
            commit.get("sha", ""),
            commit.get("author_name", ""),
            commit.get("predicted_type", ""),
            commit.get("lines_added", 0),
            commit.get("lines_deleted", 0),
            commit.get("files_changed", 0),
        ])
    
    return output.getvalue().encode("utf-8")

"""Pydantic schemas for API request/response."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# Request schemas

class AnalyzeRepoRequest(BaseModel):
    """Request to analyze a repository."""
    repo_url: str = Field(..., example="https://github.com/user/repo.git")
    limit: Optional[int] = Field(None, example=500, description="Max commits (0=unlimited)")


# Response schemas

class AnalysisJobResponse(BaseModel):
    """Response for job status."""
    job_id: str
    repo_url: str
    repo_name: str
    status: str  # pending, processing, completed, failed
    progress: float
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ContributorResponse(BaseModel):
    """Response for contributor info."""
    author_id: str
    name: str
    email: str
    cluster: int
    cluster_name: str
    total_commits: int
    active_days: int
    lines_added: int
    lines_deleted: int
    files_touched: int
    contribution_percentage: float


class CommitResponse(BaseModel):
    """Response for commit info."""
    sha: str
    message_subject: str
    author_name: str
    predicted_type: str
    lines_added: int
    lines_deleted: int
    files_changed: int
    commit_date: datetime


class AnalysisSummary(BaseModel):
    """Summary statistics."""
    total_commits: int
    total_contributors: int
    total_lines_added: int
    total_lines_deleted: int
    analysis_date: datetime
    commit_type_distribution: Dict[str, int]
    cluster_distribution: Dict[str, int]


class AnalysisResultResponse(BaseModel):
    """Complete analysis result."""
    job_id: str
    repo_name: str
    summary: AnalysisSummary
    contributors: List[ContributorResponse]
    commits: List[CommitResponse]
    cluster_distribution: Dict[str, int]
    commit_type_distribution: Dict[str, int]


class ExportRequest(BaseModel):
    """Request to export analysis."""
    result_id: str
    format: str = Field(..., description="pdf or csv")
    include: Optional[List[str]] = Field(
        default=["summary", "contributors", "commits"],
        description="What to include in export"
    )

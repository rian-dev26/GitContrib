"""Database models for analysis history and results."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Float, Integer
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class AnalysisJob(Base):
    """Store analysis job records."""
    __tablename__ = "analysis_jobs"
    
    job_id = Column(String(50), primary_key=True)
    repo_url = Column(String(500), nullable=False)
    repo_name = Column(String(255), nullable=False)
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0-100%
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)


class AnalysisResult(Base):
    """Store analysis results."""
    __tablename__ = "analysis_results"
    
    result_id = Column(String(50), primary_key=True)
    job_id = Column(String(50), nullable=False)  # Foreign key
    repo_name = Column(String(255), nullable=False)
    n_commits = Column(Integer)
    n_contributors = Column(Integer)
    n_clusters = Column(Integer)
    
    # Summary stats (JSON)
    summary = Column(JSON)
    
    # Cluster distribution
    cluster_distribution = Column(JSON)
    
    # Commit type distribution
    commit_type_distribution = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Contributor(Base):
    """Store contributor details."""
    __tablename__ = "contributors"
    
    contributor_id = Column(String(100), primary_key=True)
    result_id = Column(String(50), nullable=False)  # Foreign key
    author_id = Column(String(100))
    name = Column(String(255))
    email = Column(String(255))
    cluster = Column(Integer)
    cluster_name = Column(String(100))
    total_commits = Column(Integer)
    active_days = Column(Integer)
    lines_added = Column(Integer)
    lines_deleted = Column(Integer)
    files_touched = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Commit(Base):
    """Store commit details."""
    __tablename__ = "commits"
    
    commit_id = Column(String(100), primary_key=True)
    result_id = Column(String(50), nullable=False)  # Foreign key
    sha = Column(String(40))
    message_subject = Column(String(500))
    author_id = Column(String(100))
    author_name = Column(String(255))
    predicted_type = Column(String(50))  # feat, fix, docs, etc
    lines_added = Column(Integer)
    lines_deleted = Column(Integer)
    files_changed = Column(Integer)
    commit_date = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)

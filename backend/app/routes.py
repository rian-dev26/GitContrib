"""API routes."""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
import uuid
from pathlib import Path
import tempfile
import subprocess
import logging
from datetime import datetime

from app.schemas import AnalyzeRepoRequest, AnalysisJobResponse
from app.database import get_db
from app.models import AnalysisJob, AnalysisResult, Contributor, Commit
from app.extraction import analyze_repo

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/analyze", response_model=AnalysisJobResponse)
async def analyze(
    req: AnalyzeRepoRequest,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Start analysis job."""
    job_id = str(uuid.uuid4())
    job = AnalysisJob(job_id=job_id, repo_url=req.repo_url, 
                     repo_name=req.repo_url.split("/")[-1].replace(".git", ""))
    db.add(job)
    db.commit()
    
    bg.add_task(_analyze_bg, job_id, req.repo_url, req.limit or 0)
    
    return AnalysisJobResponse(
        job_id=job_id, repo_url=req.repo_url, repo_name=job.repo_name,
        status="pending", progress=0.0, created_at=job.created_at,
    )


@router.get("/jobs/{job_id}", response_model=AnalysisJobResponse)
async def status(job_id: str, db: Session = Depends(get_db)):
    """Get job status."""
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404)
    return AnalysisJobResponse(
        job_id=job.job_id, repo_url=job.repo_url, repo_name=job.repo_name,
        status=job.status, progress=job.progress, error_message=job.error_message,
        created_at=job.created_at, completed_at=job.completed_at,
    )


@router.get("/results/{job_id}")
async def results(job_id: str, db: Session = Depends(get_db)):
    """Get analysis result."""
    res = db.query(AnalysisResult).filter(AnalysisResult.job_id == job_id).first()
    if not res:
        raise HTTPException(status_code=404)
    
    contribs = db.query(Contributor).filter(Contributor.result_id == res.result_id).all()
    commits = db.query(Commit).filter(Commit.result_id == res.result_id).all()
    
    return {
        "repo_name": res.repo_name,
        "summary": res.summary,
        "contributors": [{
            "author_id": c.author_id,
            "name": c.name,
            "cluster": c.cluster,
            "commits": c.total_commits,
            "lines_added": c.lines_added,
            "lines_deleted": c.lines_deleted,
        } for c in contribs],
        "commits": [{
            "sha": c.sha,
            "message": c.message_subject or "",
            "type": c.predicted_type,
            "author": c.author_name,
            "lines_added": c.lines_added or 0,
            "lines_deleted": c.lines_deleted or 0,
        } for c in commits],
    }


def _analyze_bg(job_id: str, url: str, limit: int):
    """Background analysis task (runs synchronously in thread pool to prevent blocking async loop)."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
        job.status = "processing"
        job.progress = 20.0
        db.commit()
        
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / "repo"
            subprocess.run(["git", "clone", "--quiet", url, str(repo)], check=True, timeout=300)
            job.progress = 40.0
            db.commit()
            
            data = analyze_repo(repo, job.repo_name, limit)
            job.progress = 80.0
            db.commit()
            
            rid = str(uuid.uuid4())
            result = AnalysisResult(result_id=rid, job_id=job_id, repo_name=job.repo_name,
                                   n_commits=data["n_commits"], n_contributors=data["n_contributors"],
                                   summary={"date": str(datetime.now())})
            db.add(result)
            
            for c in data["contributors"][:50]:
                db.add(Contributor(
                    contributor_id=f"{rid}_{c['author_id']}",
                    result_id=rid,
                    author_id=c["author_id"],
                    name=c["name"],
                    cluster=c.get("cluster", 0),
                    total_commits=c["total_commits"],
                    lines_added=c.get("lines_added", 0),
                    lines_deleted=c.get("lines_deleted", 0),
                    active_days=c.get("active_days", 0),
                ))
            
            for cm in data["commits"][:100]:
                db.add(Commit(
                    commit_id=f"{rid}_{cm['sha']}",
                    result_id=rid,
                    sha=cm["sha"],
                    message_subject=cm.get("message", ""),
                    author_name=cm["author"],
                    predicted_type=cm["type"],
                    lines_added=cm.get("lines_added", 0),
                    lines_deleted=cm.get("lines_deleted", 0),
                ))
            
            db.commit()
            job.status = "completed"
            job.progress = 100.0
            job.completed_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()

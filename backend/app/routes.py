"""API routes."""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
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
    clean_id = job_id.replace("job-", "")
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == clean_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return AnalysisJobResponse(
        job_id=job.job_id, repo_url=job.repo_url, repo_name=job.repo_name,
        status=job.status, progress=job.progress, error_message=job.error_message,
        created_at=job.created_at, completed_at=job.completed_at,
    )


@router.get("/results/{job_id}")
async def results(job_id: str, db: Session = Depends(get_db)):
    """Get analysis result."""
    clean_id = job_id.replace("job-", "")
    res = db.query(AnalysisResult).filter(
        (AnalysisResult.job_id == clean_id) | 
        (AnalysisResult.result_id == clean_id)
    ).first()
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    
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
            "lines_added": c.lines_added or 0,
            "lines_deleted": c.lines_deleted or 0,
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


@router.get("/repositories")
async def list_repositories(db: Session = Depends(get_db)):
    """List all analyzed repositories from database."""
    results = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).all()
    repos = []
    seen = set()
    for r in results:
        if r.repo_name in seen:
            continue
        seen.add(r.repo_name)
        job = db.query(AnalysisJob).filter(AnalysisJob.job_id == r.job_id).first()
        repos.append({
            "id": f"job-{r.job_id}",
            "name": r.repo_name,
            "fullName": f"repo/{r.repo_name}",
            "url": job.repo_url if job else f"https://github.com/{r.repo_name}",
            "defaultBranch": "main",
            "isPrivate": False,
            "createdAt": r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat(),
            "lastAnalyzedAt": r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat(),
            "stats": {
                "totalCommits": r.n_commits or 0,
                "totalContributors": r.n_contributors or 0,
                "branchesCount": 1,
            }
        })
    return repos


@router.get("/repositories/{repo_id}")
async def get_repository_detail(repo_id: str, db: Session = Depends(get_db)):
    """Get single repository with full contributors and commits."""
    clean_id = repo_id.replace("job-", "")
    res = db.query(AnalysisResult).filter(
        (AnalysisResult.job_id == clean_id) | 
        (AnalysisResult.result_id == clean_id) | 
        (AnalysisResult.repo_name == repo_id)
    ).order_by(AnalysisResult.created_at.desc()).first()
    
    if not res:
        res = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).first()
        if not res:
            raise HTTPException(status_code=404, detail="Repository not found")
    
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == res.job_id).first()
    contribs = db.query(Contributor).filter(Contributor.result_id == res.result_id).all()
    commits = db.query(Commit).filter(Commit.result_id == res.result_id).all()
    
    return {
        "id": f"job-{res.job_id}",
        "name": res.repo_name,
        "fullName": f"repo/{res.repo_name}",
        "url": job.repo_url if job else f"https://github.com/{res.repo_name}",
        "defaultBranch": "main",
        "createdAt": res.created_at.isoformat() if res.created_at else datetime.utcnow().isoformat(),
        "lastAnalyzedAt": res.created_at.isoformat() if res.created_at else datetime.utcnow().isoformat(),
        "stats": {
            "totalCommits": res.n_commits or len(commits),
            "totalContributors": res.n_contributors or len(contribs),
            "branchesCount": 1,
        },
        "contributors": [{
            "author_id": c.author_id,
            "name": c.name,
            "cluster": c.cluster,
            "commits": c.total_commits,
            "lines_added": c.lines_added or 0,
            "lines_deleted": c.lines_deleted or 0,
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


@router.get("/contributors")
async def list_contributors(repositoryId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """List contributors, optionally filtered by repositoryId (job-UUID or result_id)."""
    clean_id = (repositoryId or "").replace("job-", "")
    
    query = db.query(Contributor)
    if clean_id:
        res = db.query(AnalysisResult).filter(
            (AnalysisResult.job_id == clean_id) | 
            (AnalysisResult.result_id == clean_id) |
            (AnalysisResult.repo_name == clean_id)
        ).first()
        if res:
            query = query.filter(Contributor.result_id == res.result_id)
            
    contribs = query.all()
    return [{
        "id": c.contributor_id,
        "author_id": c.author_id,
        "name": c.name or c.author_id,
        "cluster": c.cluster,
        "commits": c.total_commits,
        "lines_added": c.lines_added or 0,
        "lines_deleted": c.lines_deleted or 0,
    } for c in contribs]


@router.get("/commits")
async def list_commits(repositoryId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """List commits, optionally filtered by repositoryId."""
    clean_id = (repositoryId or "").replace("job-", "")
    
    query = db.query(Commit)
    if clean_id:
        res = db.query(AnalysisResult).filter(
            (AnalysisResult.job_id == clean_id) | 
            (AnalysisResult.result_id == clean_id) |
            (AnalysisResult.repo_name == clean_id)
        ).first()
        if res:
            query = query.filter(Commit.result_id == res.result_id)
            
    commits = query.order_by(Commit.created_at.desc()).limit(200).all()
    return [{
        "sha": c.sha,
        "message": c.message_subject or "",
        "type": c.predicted_type,
        "author": c.author_name,
        "lines_added": c.lines_added or 0,
        "lines_deleted": c.lines_deleted or 0,
    } for c in commits]


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

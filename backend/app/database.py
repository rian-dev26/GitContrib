"""Database connection and session management."""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os

# Resolve absolute path to gitcontrib.db
DEFAULT_DB_FILE = (Path(__file__).resolve().parent.parent / "gitcontrib.db").resolve()

# Database URL (SQLite default with absolute path, can be overridden via DATABASE_URL)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    from app.models import Base
    Base.metadata.create_all(bind=engine)

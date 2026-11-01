"""Database connection and session management."""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
import logging

logger = logging.getLogger(__name__)

# Resolve absolute path to gitcontrib.db
DEFAULT_DB_FILE = (Path(__file__).resolve().parent.parent / "gitcontrib.db").resolve()
SQLITE_URL = f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"

# Check environment variable first
ENV_DB_URL = os.getenv("DATABASE_URL")


def create_db_engine():
    """Create database engine with fallback to SQLite if external DB is unavailable."""
    if ENV_DB_URL:
        target_url = ENV_DB_URL
        if target_url.startswith("postgresql://") and not target_url.startswith("postgresql+"):
            target_url = target_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        try:
            connect_args = {} if "postgresql" in target_url else {"check_same_thread": False}
            test_engine = create_engine(target_url, connect_args=connect_args)
            with test_engine.connect():
                pass
            logger.info("Connected to database via DATABASE_URL")
            return test_engine, target_url
        except Exception as e:
            logger.warning(f"Failed to connect to configured DATABASE_URL ({e}). Falling back to SQLite.")

    # Default: SQLite (guaranteed to work locally in XAMPP)
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    logger.info(f"Using SQLite database at {DEFAULT_DB_FILE}")
    return engine, SQLITE_URL


engine, DATABASE_URL = create_db_engine()
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

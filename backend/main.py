"""Main FastAPI app dengan auth + analysis routes."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.database import init_db
from app.routes_auth import router as auth_router
from app.routes import router as analysis_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown."""
    init_db()
    logger.info("API started (auth + analysis)")
    yield
    logger.info("API stopped")


app = FastAPI(title="GitContrib API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include both routers
app.include_router(auth_router)
app.include_router(analysis_router)


@app.get("/health")
async def health():
    return {"status": "ok"}

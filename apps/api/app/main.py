import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.import_routes import router as import_router
from app.api.matching_routes import router as matching_router
from app.api.results_routes import router as results_router
from app.api.sync_routes import router as sync_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title=settings.app_name,
    description="API para rankings, comparaciones y cálculos deportivos",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(import_router, prefix="/api")
app.include_router(matching_router, prefix="/api")
app.include_router(results_router, prefix="/api")
app.include_router(sync_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "SPORTIA API", "version": "0.1.0"}

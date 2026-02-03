"""API routes for importing competition results."""

from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client

from app.core.config import settings
from app.services.fecna_import import (
    get_fecna_stats,
    import_to_supabase,
    read_fecna_results,
)

router = APIRouter(prefix="/import", tags=["import"])

# Path to FECNA database (relative to project root)
FECNA_DB_PATH = Path(__file__).parent.parent.parent.parent.parent / "fecna_data.db"


class ImportResult(BaseModel):
    """Response model for import operation."""

    imported: int
    errors: int
    total: int
    message: str


class FecnaStats(BaseModel):
    """Response model for FECNA database statistics."""

    total_records: int
    valid_records: int
    date_range: dict[str, str | None]
    unique_swimmers: int
    unique_tournaments: int


@router.get("/fecna/stats", response_model=FecnaStats)
async def get_stats() -> FecnaStats:
    """Get statistics about the FECNA database."""
    try:
        stats = get_fecna_stats(FECNA_DB_PATH)
        return FecnaStats(**stats)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"FECNA database not found at {FECNA_DB_PATH}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fecna", response_model=ImportResult)
async def import_fecna(
    limit: int = Query(default=1000, ge=1, le=10000, description="Max records to import"),
    offset: int = Query(default=0, ge=0, description="Records to skip"),
) -> ImportResult:
    """Import FECNA competition results to Supabase.

    This endpoint reads data from the local FECNA SQLite database
    and imports it into the swim_competition_results table.
    """
    try:
        # Read from SQLite
        results = read_fecna_results(FECNA_DB_PATH, limit=limit, offset=offset)

        if not results:
            return ImportResult(
                imported=0,
                errors=0,
                total=0,
                message="No valid records found to import",
            )

        # Create Supabase client
        supabase = create_client(settings.supabase_url, settings.supabase_key)

        # Import to Supabase
        stats = await import_to_supabase(supabase, results)

        return ImportResult(
            imported=stats["imported"],
            errors=stats["errors"],
            total=stats["total"],
            message=f"Successfully imported {stats['imported']} records",
        )

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"FECNA database not found at {FECNA_DB_PATH}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fecna/preview")
async def preview_fecna(
    limit: int = Query(default=10, ge=1, le=100, description="Number of records to preview"),
    offset: int = Query(default=0, ge=0, description="Records to skip"),
) -> dict[str, Any]:
    """Preview FECNA results before importing.

    Returns a sample of the data that would be imported.
    """
    try:
        results = read_fecna_results(FECNA_DB_PATH, limit=limit, offset=offset)
        return {
            "count": len(results),
            "results": results,
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"FECNA database not found at {FECNA_DB_PATH}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

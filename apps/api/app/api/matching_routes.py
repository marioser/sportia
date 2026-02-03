"""API routes for entity matching operations."""

from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel
from supabase import create_client

from app.core.config import settings
from app.services.matching import (
    auto_match_high_confidence,
    confirm_match,
    create_match_suggestion,
    find_athlete_matches,
    get_match_stats,
    get_pending_matches,
    get_unmatched_external_names,
    reject_match,
    suggest_matches_batch,
)

router = APIRouter(prefix="/matching", tags=["matching"])


class ConfirmMatchRequest(BaseModel):
    """Request body for confirming a match."""

    internal_id: str
    reviewed_by: str | None = None


class CreateMatchRequest(BaseModel):
    """Request body for creating a match suggestion."""

    external_name: str
    internal_id: str | None = None
    confidence_score: float = 0.5
    source: str = "FECNA"
    metadata: dict[str, Any] | None = None


class BatchMatchRequest(BaseModel):
    """Request body for batch match suggestions."""

    external_names: list[str]
    min_similarity: float = 0.6


@router.get("/stats")
async def get_stats() -> dict[str, Any]:
    """Get matching statistics.

    Returns counts of pending/confirmed/rejected matches and
    linked/unlinked competition results.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    return await get_match_stats(supabase)


@router.get("/athletes/unmatched")
async def get_unmatched_athletes(
    limit: int = Query(default=100, ge=1, le=500, description="Max names to return"),
    group_by: str = Query(
        default="team",
        regex="^(team|gender|both)$",
        description="Group by: 'team' (club), 'gender', or 'both'"
    ),
    team_code: str | None = Query(default=None, description="Filter by team code"),
) -> dict[str, Any]:
    """Get external athlete names that haven't been matched.

    Returns distinct swimmer names from competition results
    that don't have a confirmed mapping to an internal athlete.

    Groups are sorted alphabetically. Within each group, swimmers
    are sorted alphabetically by name.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    return await get_unmatched_external_names(supabase, limit, group_by, team_code)


def _normalize_gender(gender: str | None) -> str | None:
    """Normalize gender to M or F."""
    if not gender:
        return None
    g = gender.lower().strip()
    # Check for male indicators
    if g in ("m", "men", "male", "hombres", "masculino"):
        return "M"
    # Check for female indicators
    if g in ("f", "women", "female", "mujeres", "femenino"):
        return "F"
    return None


@router.get("/athletes/unmatched-summary")
async def get_unmatched_summary() -> dict[str, Any]:
    """Get summary of unmatched swimmers grouped by team code.

    Returns team codes with counts of unmatched swimmers, useful for
    displaying a collapsed list that can be expanded lazily.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Fetch all unlinked results with pagination (Supabase default limit is 1000)
    all_data = []
    page_size = 1000
    offset = 0

    while True:
        response = (
            supabase.table("swim_competition_results")
            .select("team_code, swimmer_name_norm, gender")
            .is_("athlete_id", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )

        if not response.data:
            break

        all_data.extend(response.data)
        if len(response.data) < page_size:
            break
        offset += page_size

    # Group by team code and count unique swimmers
    team_stats: dict[str, dict] = {}
    for r in all_data:
        team = r.get("team_code") or "SIN_CLUB"
        if team not in team_stats:
            team_stats[team] = {
                "team_code": team,
                "swimmer_count": 0,
                "male_count": 0,
                "female_count": 0,
                "swimmers_seen": set(),
            }

        swimmer_key = r.get("swimmer_name_norm")
        if swimmer_key and swimmer_key not in team_stats[team]["swimmers_seen"]:
            team_stats[team]["swimmers_seen"].add(swimmer_key)
            team_stats[team]["swimmer_count"] += 1

            # Normalize gender properly
            gender = _normalize_gender(r.get("gender"))
            if gender == "M":
                team_stats[team]["male_count"] += 1
            elif gender == "F":
                team_stats[team]["female_count"] += 1

    # Convert to list and remove the set
    result = []
    for team in sorted(team_stats.keys()):
        stats = team_stats[team]
        result.append({
            "team_code": stats["team_code"],
            "swimmer_count": stats["swimmer_count"],
            "male_count": stats["male_count"],
            "female_count": stats["female_count"],
        })

    return {
        "total_teams": len(result),
        "total_swimmers": sum(t["swimmer_count"] for t in result),
        "teams": result,
    }


@router.get("/athletes/pending")
async def get_pending_athlete_matches(
    limit: int = Query(default=50, ge=1, le=200, description="Max matches to return"),
    offset: int = Query(default=0, ge=0, description="Records to skip"),
) -> dict[str, Any]:
    """Get pending athlete matches awaiting review.

    Returns matches sorted by confidence score (highest first).
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    return await get_pending_matches(supabase, "athlete", limit, offset)


@router.get("/athletes/search")
async def search_athlete_matches(
    name: str = Query(..., description="External name to match"),
    club_id: str | None = Query(default=None, description="Filter by club"),
    min_similarity: float = Query(default=0.5, ge=0, le=1, description="Minimum similarity"),
    limit: int = Query(default=10, ge=1, le=50, description="Max matches"),
) -> dict[str, Any]:
    """Search for potential athlete matches.

    Uses fuzzy matching based on Levenshtein distance.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    matches = await find_athlete_matches(
        supabase,
        name,
        club_id=club_id,
        min_similarity=min_similarity,
        limit=limit,
    )

    return {
        "external_name": name,
        "count": len(matches),
        "matches": matches,
    }


@router.post("/athletes/suggest-batch")
async def suggest_batch_matches(
    request: BatchMatchRequest,
) -> dict[str, Any]:
    """Find potential matches for multiple external names.

    Useful for processing many unmatched names at once.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    suggestions = await suggest_matches_batch(
        supabase,
        request.external_names,
        request.min_similarity,
    )

    return {
        "count": len(suggestions),
        "suggestions": suggestions,
    }


@router.post("/athletes/create")
async def create_athlete_match(
    request: CreateMatchRequest,
) -> dict[str, Any]:
    """Create a new athlete match suggestion.

    Creates a pending match that can be reviewed and confirmed.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    match = await create_match_suggestion(
        supabase,
        "athlete",
        request.external_name,
        request.internal_id,
        request.confidence_score,
        request.source,
        request.metadata,
    )

    return {
        "success": True,
        "match": match,
    }


@router.post("/athletes/{mapping_id}/confirm")
async def confirm_athlete_match(
    mapping_id: str,
    request: ConfirmMatchRequest,
) -> dict[str, Any]:
    """Confirm an athlete match.

    Links the external name to an internal athlete and
    updates all related competition results.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    match = await confirm_match(
        supabase,
        "athlete",
        mapping_id,
        request.internal_id,
        request.reviewed_by,
    )

    return {
        "success": True,
        "match": match,
    }


@router.post("/athletes/{mapping_id}/reject")
async def reject_athlete_match(
    mapping_id: str,
    reviewed_by: str | None = Query(default=None, description="Reviewer user ID"),
) -> dict[str, Any]:
    """Reject an athlete match suggestion.

    Marks the match as rejected so it won't be shown again.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    match = await reject_match(
        supabase,
        "athlete",
        mapping_id,
        reviewed_by,
    )

    return {
        "success": True,
        "match": match,
    }


@router.post("/athletes/auto-match")
async def auto_match_athletes(
    min_confidence: float = Query(
        default=0.8, ge=0.6, le=0.99, description="Minimum confidence for auto-match (60%-99%)"
    ),
    dry_run: bool = Query(
        default=True, description="If true, only show what would be matched"
    ),
) -> dict[str, Any]:
    """Automatically confirm high-confidence matches.

    Only matches with confidence >= min_confidence will be confirmed.
    Use dry_run=true first to preview what would be matched.
    Range: 60% (more matches, less precision) to 99% (fewer matches, high precision).
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    return await auto_match_high_confidence(
        supabase,
        min_confidence,
        dry_run,
    )


# Club matching endpoints (similar pattern)

@router.get("/clubs/pending")
async def get_pending_club_matches(
    limit: int = Query(default=50, ge=1, le=200, description="Max matches to return"),
    offset: int = Query(default=0, ge=0, description="Records to skip"),
) -> dict[str, Any]:
    """Get pending club matches awaiting review."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    return await get_pending_matches(supabase, "club", limit, offset)


@router.post("/clubs/{mapping_id}/confirm")
async def confirm_club_match(
    mapping_id: str,
    request: ConfirmMatchRequest,
) -> dict[str, Any]:
    """Confirm a club match."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    match = await confirm_match(
        supabase,
        "club",
        mapping_id,
        request.internal_id,
        request.reviewed_by,
    )

    return {
        "success": True,
        "match": match,
    }


@router.post("/clubs/{mapping_id}/reject")
async def reject_club_match(
    mapping_id: str,
    reviewed_by: str | None = Query(default=None, description="Reviewer user ID"),
) -> dict[str, Any]:
    """Reject a club match suggestion."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    match = await reject_match(
        supabase,
        "club",
        mapping_id,
        reviewed_by,
    )

    return {
        "success": True,
        "match": match,
    }


# ============ Club Team Code Linking ============

@router.get("/clubs/team-codes")
async def get_all_team_codes() -> dict[str, Any]:
    """Get all team codes from FECNA competition results.

    Returns list of team codes with result counts and link status.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    response = supabase.rpc("get_all_team_codes").execute()

    return {
        "count": len(response.data) if response.data else 0,
        "team_codes": response.data or [],
    }


@router.get("/clubs/{club_id}/team-codes")
async def get_club_linked_team_codes(club_id: str) -> dict[str, Any]:
    """Get team codes linked to a specific club."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    response = supabase.rpc("get_club_team_codes", {"p_club_id": club_id}).execute()

    return {
        "club_id": club_id,
        "count": len(response.data) if response.data else 0,
        "team_codes": response.data or [],
    }


class LinkTeamCodeRequest(BaseModel):
    """Request body for linking a team code to a club."""
    team_code: str


@router.post("/clubs/{club_id}/team-codes")
async def link_team_code_to_club(
    club_id: str,
    request: LinkTeamCodeRequest,
) -> dict[str, Any]:
    """Link a FECNA team code to an internal club."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Check if already linked
    existing = (
        supabase.table("club_external_mappings")
        .select("id")
        .eq("external_code", request.team_code)
        .eq("status", "CONFIRMED")
        .execute()
    )

    if existing.data:
        return {
            "success": False,
            "error": f"Team code '{request.team_code}' is already linked to a club",
        }

    # Create the mapping
    response = (
        supabase.table("club_external_mappings")
        .insert({
            "club_id": club_id,
            "external_code": request.team_code,
            "source": "FECNA",
            "status": "CONFIRMED",
            "confidence_score": 1.0,
        })
        .execute()
    )

    return {
        "success": True,
        "mapping": response.data[0] if response.data else None,
    }


@router.delete("/clubs/{club_id}/team-codes/{team_code}")
async def unlink_team_code_from_club(
    club_id: str,
    team_code: str,
) -> dict[str, Any]:
    """Remove a team code link from a club."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    response = (
        supabase.table("club_external_mappings")
        .delete()
        .eq("club_id", club_id)
        .eq("external_code", team_code)
        .execute()
    )

    return {
        "success": True,
        "deleted": len(response.data) if response.data else 0,
    }


@router.get("/clubs/{club_id}/unmatched-swimmers")
async def get_club_unmatched_swimmers(
    club_id: str,
    limit: int = Query(default=100, ge=1, le=500),
) -> dict[str, Any]:
    """Get unmatched swimmers for a specific club's linked team codes."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Get the club's linked team codes
    team_codes_response = supabase.rpc(
        "get_club_team_codes",
        {"p_club_id": club_id}
    ).execute()

    if not team_codes_response.data:
        return {
            "club_id": club_id,
            "team_codes": [],
            "count": 0,
            "swimmers": [],
        }

    team_codes = [tc["external_code"] for tc in team_codes_response.data]

    # Get unmatched swimmers for these team codes
    response = (
        supabase.table("swim_competition_results")
        .select("swimmer_name, swimmer_name_norm, gender, team_code")
        .in_("team_code", team_codes)
        .is_("athlete_id", "null")
        .limit(limit * 3)
        .execute()
    )

    # Group and count
    swimmers_dict: dict[str, dict] = {}
    for r in response.data or []:
        key = r["swimmer_name_norm"]
        if key not in swimmers_dict:
            swimmers_dict[key] = {
                "swimmer_name": r["swimmer_name"],
                "swimmer_name_norm": key,
                "gender": r["gender"],
                "team_code": r["team_code"],
                "result_count": 0,
            }
        swimmers_dict[key]["result_count"] += 1

    swimmers = sorted(
        swimmers_dict.values(),
        key=lambda x: (-x["result_count"], x["swimmer_name"])
    )[:limit]

    return {
        "club_id": club_id,
        "team_codes": team_codes,
        "count": len(swimmers),
        "swimmers": swimmers,
    }

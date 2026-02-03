"""API routes for searching and querying competition results."""

from typing import Any

from fastapi import APIRouter, Query
from supabase import create_client

from app.core.config import settings

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/search")
async def search_results(
    swimmer_name: str | None = Query(default=None, description="Swimmer name (partial match)"),
    team_code: str | None = Query(default=None, description="Team code"),
    tournament: str | None = Query(default=None, description="Tournament name (partial match)"),
    distance: int | None = Query(default=None, description="Distance in meters"),
    stroke: str | None = Query(default=None, description="Stroke (FREE, BACK, BREAST, FLY, IM)"),
    gender: str | None = Query(default=None, description="Gender (M or F)"),
    year: int | None = Query(default=None, description="Competition year"),
    limit: int = Query(default=50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(default=0, ge=0, description="Results to skip"),
) -> dict[str, Any]:
    """Search competition results with filters.

    Returns matching results sorted by final time (fastest first).
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    query = supabase.table("swim_competition_results").select("*")

    if swimmer_name:
        # Use normalized name for search
        query = query.ilike("swimmer_name_norm", f"%{swimmer_name.lower()}%")

    if team_code:
        query = query.eq("team_code", team_code.upper())

    if tournament:
        query = query.ilike("tournament_name", f"%{tournament}%")

    if distance:
        query = query.eq("distance_m", distance)

    if stroke:
        query = query.eq("stroke", stroke.upper())

    if gender:
        query = query.eq("gender", gender.upper())

    if year:
        query = query.eq("year", year)

    # Order by fastest time
    query = query.order("final_time_ms").range(offset, offset + limit - 1)

    response = query.execute()

    return {
        "count": len(response.data),
        "results": response.data,
    }


@router.get("/swimmer/{swimmer_name}")
async def get_swimmer_results(
    swimmer_name: str,
    limit: int = Query(default=100, ge=1, le=500, description="Max results to return"),
) -> dict[str, Any]:
    """Get all results for a specific swimmer.

    Returns results grouped by event with best times.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Search by normalized name
    response = (
        supabase.table("swim_competition_results")
        .select("*")
        .ilike("swimmer_name_norm", f"%{swimmer_name.lower()}%")
        .order("distance_m")
        .order("stroke")
        .order("final_time_ms")
        .limit(limit)
        .execute()
    )

    # Group results by event and find best times
    events: dict[str, dict[str, Any]] = {}
    all_results = []

    for result in response.data:
        all_results.append(result)
        event_key = f"{result['distance_m']}_{result['stroke']}"

        if event_key not in events:
            events[event_key] = {
                "distance_m": result["distance_m"],
                "stroke": result["stroke"],
                "best_time_ms": result["final_time_ms"],
                "best_result": result,
                "count": 1,
            }
        else:
            events[event_key]["count"] += 1
            if result["final_time_ms"] < events[event_key]["best_time_ms"]:
                events[event_key]["best_time_ms"] = result["final_time_ms"]
                events[event_key]["best_result"] = result

    return {
        "swimmer_name": swimmer_name,
        "total_results": len(all_results),
        "events": list(events.values()),
        "results": all_results,
    }


@router.get("/rankings")
async def get_rankings(
    distance: int = Query(..., description="Distance in meters"),
    stroke: str = Query(..., description="Stroke (FREE, BACK, BREAST, FLY, IM)"),
    gender: str = Query(..., description="Gender (M or F)"),
    year: int | None = Query(default=None, description="Filter by year"),
    age_min: int | None = Query(default=None, description="Minimum age"),
    age_max: int | None = Query(default=None, description="Maximum age"),
    limit: int = Query(default=50, ge=1, le=200, description="Max results to return"),
) -> dict[str, Any]:
    """Get rankings for a specific event.

    Returns the best time per swimmer, ranked from fastest to slowest.
    """
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    query = (
        supabase.table("swim_competition_results")
        .select("*")
        .eq("distance_m", distance)
        .eq("stroke", stroke.upper())
        .eq("gender", gender.upper())
    )

    if year:
        query = query.eq("year", year)

    if age_min:
        query = query.gte("age", age_min)

    if age_max:
        query = query.lte("age", age_max)

    response = query.order("final_time_ms").limit(limit * 3).execute()

    # Deduplicate by swimmer (keep best time)
    seen_swimmers: set[str] = set()
    rankings: list[dict[str, Any]] = []

    for result in response.data:
        swimmer_key = result["swimmer_name_norm"]
        if swimmer_key not in seen_swimmers:
            seen_swimmers.add(swimmer_key)
            rankings.append(result)
            if len(rankings) >= limit:
                break

    # Add rank
    for i, result in enumerate(rankings, 1):
        result["rank"] = i

    return {
        "event": f"{distance}m {stroke} ({gender})",
        "count": len(rankings),
        "rankings": rankings,
    }


@router.get("/tournaments")
async def get_tournaments(
    year: int | None = Query(default=None, description="Filter by year"),
    limit: int = Query(default=50, ge=1, le=200, description="Max tournaments to return"),
) -> dict[str, Any]:
    """Get list of available tournaments."""
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # This is a simplified query - in production you'd want a view or aggregation
    query = (
        supabase.table("swim_competition_results")
        .select("tournament_name, year, event_date")
    )

    if year:
        query = query.eq("year", year)

    response = query.order("event_date", desc=True).limit(1000).execute()

    # Deduplicate tournaments
    seen: set[str] = set()
    tournaments: list[dict[str, Any]] = []

    for result in response.data:
        key = f"{result['tournament_name']}_{result['year']}"
        if key not in seen:
            seen.add(key)
            tournaments.append({
                "name": result["tournament_name"],
                "year": result["year"],
                "date": result["event_date"],
            })
            if len(tournaments) >= limit:
                break

    return {
        "count": len(tournaments),
        "tournaments": tournaments,
    }

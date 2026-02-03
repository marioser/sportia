"""Service for matching external competition data with internal entities."""

from typing import Any

from supabase import Client


async def find_athlete_matches(
    supabase: Client,
    external_name: str,
    club_id: str | None = None,
    min_similarity: float = 0.6,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Find potential athlete matches for an external name.

    Uses Python-based similarity calculation for reliability.

    Args:
        supabase: Supabase client instance
        external_name: Name from external data source
        club_id: Optional club ID to filter candidates
        min_similarity: Minimum similarity score (0-1)
        limit: Maximum matches to return

    Returns:
        List of potential matches with similarity scores
    """
    import unicodedata

    def normalize(name: str) -> str:
        if not name:
            return ""
        nfkd = unicodedata.normalize("NFKD", name)
        ascii_name = nfkd.encode("ASCII", "ignore").decode("ASCII")
        return " ".join(ascii_name.lower().split())

    def similarity(a: str, b: str) -> float:
        a, b = normalize(a), normalize(b)
        if not a or not b:
            return 0.0
        if a == b:
            return 1.0

        # Word overlap + partial match
        words_a = set(a.split())
        words_b = set(b.split())
        if not words_a or not words_b:
            return 0.0

        intersection = len(words_a & words_b)
        union = len(words_a | words_b)
        jaccard = intersection / union if union > 0 else 0.0

        # Boost if one name contains the other
        if a in b or b in a:
            jaccard = max(jaccard, 0.7)

        return jaccard

    # Query athletes from database
    query = supabase.table("athletes").select(
        "id, first_name, last_name, birth_date, club_id, clubs(name)"
    ).eq("active", True)

    if club_id:
        query = query.eq("club_id", club_id)

    response = query.limit(limit * 3).execute()

    if not response.data:
        return []

    results = []
    for athlete in response.data:
        full_name = f"{athlete['first_name']} {athlete['last_name']}"
        score = similarity(external_name, full_name)

        if score >= min_similarity:
            results.append({
                "athlete_id": athlete["id"],
                "first_name": athlete["first_name"],
                "last_name": athlete["last_name"],
                "full_name": full_name,
                "birth_date": athlete.get("birth_date"),
                "club_name": athlete.get("clubs", {}).get("name") if athlete.get("clubs") else None,
                "similarity_score": round(score, 2),
            })

    # Sort by similarity score descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:limit]


async def get_pending_matches(
    supabase: Client,
    match_type: str = "athlete",
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """Get pending matches for review.

    Args:
        supabase: Supabase client instance
        match_type: Type of match ('athlete' or 'club')
        limit: Maximum records to return
        offset: Records to skip

    Returns:
        Dictionary with matches and total count
    """
    table = f"{match_type}_external_mappings"

    # Get total count
    count_response = (
        supabase.table(table)
        .select("*", count="exact")
        .eq("status", "PENDING")
        .execute()
    )
    total = count_response.count or 0

    # Get paginated results
    response = (
        supabase.table(table)
        .select("*")
        .eq("status", "PENDING")
        .order("confidence_score", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "total": total,
        "matches": response.data or [],
    }


async def get_unmatched_external_names(
    supabase: Client,
    limit: int = 100,
    group_by: str = "team",
    team_code: str | None = None,
) -> dict[str, Any]:
    """Get distinct external names that haven't been matched yet.

    Returns swimmer names from competition results that don't have
    a confirmed mapping to an internal athlete, grouped and sorted.

    Args:
        supabase: Supabase client instance
        limit: Maximum names to return
        group_by: Grouping option ('team', 'gender', or 'both')
        team_code: Optional team code filter

    Returns:
        Dictionary with grouped unmatched names
    """
    # If filtering by team_code, use direct query for better performance
    if team_code:
        # Helper to normalize gender
        def normalize_gender(g: str | None) -> str:
            if not g:
                return "M"
            gl = g.lower().strip()
            if gl in ("m", "men", "male", "hombres", "masculino"):
                return "M"
            if gl in ("f", "women", "female", "mujeres", "femenino"):
                return "F"
            return "M"

        # Fetch all results for this team with pagination
        all_data = []
        page_size = 1000
        offset = 0

        while True:
            response = (
                supabase.table("swim_competition_results")
                .select("swimmer_name, swimmer_name_norm, gender, team_code")
                .eq("team_code", team_code)
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

        # Group and count swimmers
        swimmers_dict: dict[str, dict] = {}
        for r in all_data:
            key = r["swimmer_name_norm"]
            if key not in swimmers_dict:
                swimmers_dict[key] = {
                    "swimmer_name": r["swimmer_name"],
                    "swimmer_name_norm": key,
                    "gender": normalize_gender(r["gender"]),
                    "team_code": r["team_code"],
                    "result_count": 0,
                }
            swimmers_dict[key]["result_count"] += 1

        data = sorted(
            swimmers_dict.values(),
            key=lambda x: (-x["result_count"], x["swimmer_name"])
        )[:limit]
    else:
        # Get unique swimmer names from results without athlete_id
        response = supabase.rpc(
            "get_unmatched_swimmers_grouped",
            {"p_limit": limit, "p_group_by": group_by},
        ).execute()
        data = response.data or []

    # Group the results based on the group_by parameter
    if group_by == "team":
        grouped = _group_by_team(data)
    elif group_by == "gender":
        grouped = _group_by_gender(data)
    else:  # both
        grouped = _group_by_team_and_gender(data)

    return {
        "total": len(data),
        "group_by": group_by,
        "groups": grouped,
    }


def _group_by_team(data: list[dict]) -> dict[str, list[dict]]:
    """Group swimmers by team code."""
    groups: dict[str, list[dict]] = {}
    for item in data:
        team = item.get("team_code") or "SIN_CLUB"
        if team not in groups:
            groups[team] = []
        groups[team].append(item)
    # Sort teams alphabetically
    return dict(sorted(groups.items()))


def _group_by_gender(data: list[dict]) -> dict[str, list[dict]]:
    """Group swimmers by gender."""
    groups: dict[str, list[dict]] = {"M": [], "F": []}
    for item in data:
        gender = item.get("gender") or "M"
        if gender in groups:
            groups[gender].append(item)
    return groups


def _group_by_team_and_gender(data: list[dict]) -> dict[str, dict[str, list[dict]]]:
    """Group swimmers by team code and then by gender."""
    groups: dict[str, dict[str, list[dict]]] = {}
    for item in data:
        team = item.get("team_code") or "SIN_CLUB"
        gender = item.get("gender") or "M"
        if team not in groups:
            groups[team] = {"M": [], "F": []}
        if gender in groups[team]:
            groups[team][gender].append(item)
    # Sort teams alphabetically
    return dict(sorted(groups.items()))


async def suggest_matches_batch(
    supabase: Client,
    external_names: list[str],
    min_similarity: float = 0.6,
) -> list[dict[str, Any]]:
    """Find potential matches for multiple external names.

    Args:
        supabase: Supabase client instance
        external_names: List of names from external data
        min_similarity: Minimum similarity score (0-1)

    Returns:
        List of suggestions with external name and potential matches
    """
    suggestions = []

    for name in external_names:
        matches = await find_athlete_matches(
            supabase,
            name,
            min_similarity=min_similarity,
            limit=3,
        )

        suggestions.append({
            "external_name": name,
            "matches": matches,
            "best_match": matches[0] if matches else None,
        })

    return suggestions


async def create_match_suggestion(
    supabase: Client,
    match_type: str,
    external_name: str,
    internal_id: str | None,
    confidence_score: float,
    source: str = "FECNA",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a new match suggestion for review.

    Args:
        supabase: Supabase client instance
        match_type: Type of match ('athlete' or 'club')
        external_name: Name from external source
        internal_id: Suggested internal entity ID (can be None for manual review)
        confidence_score: Algorithm confidence (0-1)
        source: External data source name
        metadata: Additional context data

    Returns:
        Created match record
    """
    table = f"{match_type}_external_mappings"
    id_field = f"{match_type}_id"

    # Normalize the name
    norm_response = supabase.rpc(
        "normalize_name",
        {"name": external_name},
    ).execute()
    external_name_norm = norm_response.data

    data = {
        "external_name": external_name,
        "external_name_norm": external_name_norm,
        "confidence_score": confidence_score,
        "source": source,
        "status": "PENDING",
        "metadata": metadata or {},
    }

    if internal_id:
        data[id_field] = internal_id

    response = supabase.table(table).insert(data).execute()

    return response.data[0] if response.data else {}


async def confirm_match(
    supabase: Client,
    match_type: str,
    mapping_id: str,
    internal_id: str,
    reviewed_by: str | None = None,
) -> dict[str, Any]:
    """Confirm a match and link it to an internal entity.

    Args:
        supabase: Supabase client instance
        match_type: Type of match ('athlete' or 'club')
        mapping_id: ID of the mapping record
        internal_id: ID of the internal entity to link
        reviewed_by: ID of the user confirming the match

    Returns:
        Updated match record
    """
    table = f"{match_type}_external_mappings"
    id_field = f"{match_type}_id"

    update_data = {
        id_field: internal_id,
        "status": "CONFIRMED",
        "confirmed_at": "now()",
    }

    if reviewed_by:
        update_data["confirmed_by"] = reviewed_by

    response = (
        supabase.table(table)
        .update(update_data)
        .eq("id", mapping_id)
        .execute()
    )

    # If athlete match confirmed, update competition results
    if match_type == "athlete" and response.data:
        mapping = response.data[0]
        await link_results_to_athlete(
            supabase,
            mapping["external_name_norm"],
            internal_id,
        )

    return response.data[0] if response.data else {}


async def reject_match(
    supabase: Client,
    match_type: str,
    mapping_id: str,
    reviewed_by: str | None = None,
) -> dict[str, Any]:
    """Reject a match suggestion.

    Args:
        supabase: Supabase client instance
        match_type: Type of match ('athlete' or 'club')
        mapping_id: ID of the mapping record
        reviewed_by: ID of the user rejecting the match

    Returns:
        Updated match record
    """
    table = f"{match_type}_external_mappings"

    update_data = {
        "status": "REJECTED",
        "confirmed_at": "now()",
    }

    if reviewed_by:
        update_data["confirmed_by"] = reviewed_by

    response = (
        supabase.table(table)
        .update(update_data)
        .eq("id", mapping_id)
        .execute()
    )

    return response.data[0] if response.data else {}


async def link_results_to_athlete(
    supabase: Client,
    external_name_norm: str,
    athlete_id: str,
) -> int:
    """Link competition results to an athlete.

    Updates all competition results with matching normalized name
    to reference the internal athlete.

    Args:
        supabase: Supabase client instance
        external_name_norm: Normalized external name
        athlete_id: Internal athlete ID

    Returns:
        Number of records updated
    """
    response = (
        supabase.table("swim_competition_results")
        .update({"athlete_id": athlete_id})
        .eq("swimmer_name_norm", external_name_norm)
        .is_("athlete_id", "null")
        .execute()
    )

    return len(response.data) if response.data else 0


async def get_match_stats(
    supabase: Client,
) -> dict[str, Any]:
    """Get statistics about the matching process.

    Returns:
        Dictionary with matching statistics
    """
    # Athlete mappings stats
    athlete_stats = (
        supabase.table("athlete_external_mappings")
        .select("status", count="exact")
        .execute()
    )

    # Count by status
    athlete_pending = (
        supabase.table("athlete_external_mappings")
        .select("*", count="exact")
        .eq("status", "PENDING")
        .execute()
    )

    athlete_confirmed = (
        supabase.table("athlete_external_mappings")
        .select("*", count="exact")
        .eq("status", "CONFIRMED")
        .execute()
    )

    athlete_rejected = (
        supabase.table("athlete_external_mappings")
        .select("*", count="exact")
        .eq("status", "REJECTED")
        .execute()
    )

    # Results with/without athlete_id
    results_linked = (
        supabase.table("swim_competition_results")
        .select("*", count="exact")
        .not_.is_("athlete_id", "null")
        .execute()
    )

    results_unlinked = (
        supabase.table("swim_competition_results")
        .select("*", count="exact")
        .is_("athlete_id", "null")
        .execute()
    )

    return {
        "athlete_mappings": {
            "pending": athlete_pending.count or 0,
            "confirmed": athlete_confirmed.count or 0,
            "rejected": athlete_rejected.count or 0,
        },
        "competition_results": {
            "linked": results_linked.count or 0,
            "unlinked": results_unlinked.count or 0,
        },
    }


async def auto_match_high_confidence(
    supabase: Client,
    min_confidence: float = 0.8,
    dry_run: bool = True,
) -> dict[str, Any]:
    """Automatically confirm high-confidence matches.

    Args:
        supabase: Supabase client instance
        min_confidence: Minimum confidence score to auto-confirm (0.6-0.99)
        dry_run: If True, only return what would be matched

    Returns:
        Dictionary with auto-match results
    """
    # Get pending matches with high confidence
    response = (
        supabase.table("athlete_external_mappings")
        .select("*")
        .eq("status", "PENDING")
        .gte("confidence_score", min_confidence)
        .not_.is_("athlete_id", "null")
        .execute()
    )

    matches = response.data or []

    if dry_run:
        return {
            "dry_run": True,
            "would_confirm": len(matches),
            "matches": matches,
        }

    # Confirm each match
    confirmed = 0
    for match in matches:
        try:
            await confirm_match(
                supabase,
                "athlete",
                match["id"],
                match["athlete_id"],
                reviewed_by=None,  # Auto-confirmed
            )
            confirmed += 1
        except Exception as e:
            print(f"Error confirming match {match['id']}: {e}")

    return {
        "dry_run": False,
        "confirmed": confirmed,
        "total_candidates": len(matches),
    }

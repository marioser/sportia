"""Service for importing FECNA swimming results from SQLite database."""

import re
import sqlite3
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

from supabase import Client

# Mapping from FECNA styles to Supabase swim_stroke enum
STYLE_MAP: dict[str, str] = {
    # Spanish
    "libre": "FREE",
    "espalda": "BACK",
    "pecho": "BREAST",
    "mariposa": "FLY",
    "ci": "IM",
    "combinado": "IM",
    # English
    "free": "FREE",
    "back": "BACK",
    "breast": "BREAST",
    "fly": "FLY",
    "im": "IM",
}

# Gender mapping - IMPORTANT: longer strings first to avoid substring matching issues
# e.g., "women" must be checked before "men" since "men" is a substring of "women"
GENDER_MAP: dict[str, str] = {
    "hombres": "M",
    "mujeres": "F",
    "women": "F",  # Must come before "men"
    "men": "M",
    "masculino": "M",
    "femenino": "F",
    "male": "M",
    "female": "F",
    "m": "M",
    "f": "F",
}

# Valid distances for individual swimming events
VALID_DISTANCES = {50, 100, 200, 400, 800, 1500}

# Pattern to extract distance from style field (e.g., "18-20 400 CI Chequeo de Tiempo")
DISTANCE_PATTERN = re.compile(r'\b(50|100|200|400|800|1500)\b')


def normalize_name(name: str) -> str:
    """Normalize swimmer name for matching.

    Removes accents, converts to lowercase, and removes extra whitespace.
    """
    # Remove accents
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_name = nfkd.encode("ASCII", "ignore").decode("ASCII")
    # Lowercase and normalize whitespace
    return " ".join(ascii_name.lower().split())


def parse_time_to_ms(time_str: str | None) -> int | None:
    """Parse time string (mm:ss.cc or ss.cc) to milliseconds."""
    if not time_str or time_str.strip() in ("", "NT", "DQ", "DNS", "DNF", "NS"):
        return None

    time_str = time_str.strip()

    try:
        # Handle mm:ss.cc format
        if ":" in time_str:
            parts = time_str.split(":")
            minutes = int(parts[0])
            seconds_parts = parts[1].split(".")
            seconds = int(seconds_parts[0])
            centiseconds = int(seconds_parts[1]) if len(seconds_parts) > 1 else 0
            return (minutes * 60 + seconds) * 1000 + centiseconds * 10

        # Handle ss.cc format
        seconds_parts = time_str.split(".")
        seconds = int(seconds_parts[0])
        centiseconds = int(seconds_parts[1]) if len(seconds_parts) > 1 else 0
        return seconds * 1000 + centiseconds * 10
    except (ValueError, IndexError):
        return None


def parse_style(style_raw: str) -> str | None:
    """Extract and map swimming style from raw style string."""
    if not style_raw:
        return None

    style_lower = style_raw.lower()

    # Try to find a known style in the string
    for key, value in STYLE_MAP.items():
        if key in style_lower:
            return value

    return None


def parse_gender(gender_raw: str) -> str | None:
    """Map gender string to M/F.

    Handles various formats: M, F, Men, Women, Hombres, Mujeres, etc.
    """
    if not gender_raw:
        return None

    gender_lower = gender_raw.lower().strip()

    # First check for exact single-character matches
    if gender_lower == "m":
        return "M"
    if gender_lower == "f":
        return "F"

    # Then check for substring matches (longer strings first in GENDER_MAP)
    for key, value in GENDER_MAP.items():
        if len(key) > 1 and key in gender_lower:
            return value

    return None


def extract_distance_from_style(style_raw: str) -> int | None:
    """Extract distance from style field when distance column is missing.

    Examples:
        "18-20 400 CI Chequeo de Tiempo" → 400
        "14&O 100 Free Time Trial Finals" → 100
        "16-17 50 Espalda Chequeo de Tiempo" → 50
    """
    if not style_raw:
        return None

    match = DISTANCE_PATTERN.search(style_raw)
    if match:
        return int(match.group(1))

    return None


def parse_event_date(date_str: str | None) -> str | None:
    """Parse event date string to ISO format."""
    if not date_str:
        return None

    # Try different date formats
    formats = [
        "%d/%m/%Y",  # 11/06/2025
        "%Y-%m-%d",  # 2025-06-11
        "%m/%d/%Y",  # 06/11/2025
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None


def extract_round(style_raw: str) -> str | None:
    """Extract round info from style string."""
    style_lower = style_raw.lower()

    if "final" in style_lower:
        return "FINAL"
    elif "prelim" in style_lower:
        return "PRELIM"
    elif "elimin" in style_lower:
        return "PRELIM"
    elif "time trial" in style_lower or "chequeo" in style_lower:
        return "TIME_TRIAL"

    return None


def read_fecna_results(
    db_path: str | Path,
    limit: int | None = None,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Read results from FECNA SQLite database.

    Args:
        db_path: Path to the SQLite database file
        limit: Maximum number of records to read
        offset: Number of records to skip

    Returns:
        List of result dictionaries ready for Supabase insertion
    """
    db_path = Path(db_path)
    if not db_path.exists():
        raise FileNotFoundError(f"Database file not found: {db_path}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Include ALL records with valid time, we'll extract distance from style if needed
    query = """
        SELECT
            year,
            tournament_name,
            event_date,
            gender,
            distance,
            style,
            rank,
            swimmer_name,
            age,
            team,
            seed_time,
            final_time
        FROM results
        WHERE final_time IS NOT NULL
          AND final_time != ''
          AND final_time NOT IN ('NT', 'DQ', 'DNS', 'DNF', 'NS')
        ORDER BY event_date DESC, id
    """

    if limit:
        query += f" LIMIT {limit} OFFSET {offset}"

    cursor.execute(query)
    rows = cursor.fetchall()

    results = []
    for row in rows:
        # Parse and validate data
        stroke = parse_style(row["style"])
        gender = parse_gender(row["gender"])
        final_time_ms = parse_time_to_ms(row["final_time"])

        # Skip records without valid stroke or time
        if not stroke or not final_time_ms:
            continue

        # Get distance from column, or extract from style field as fallback
        # IMPORTANT: Some records have age in the distance column instead of actual distance
        distance = row["distance"]
        if not distance or distance not in VALID_DISTANCES:
            # Try to extract from style field (e.g., "14 / 50 Libre" -> 50)
            distance = extract_distance_from_style(row["style"])

        # Skip if still no valid distance
        if not distance or distance not in VALID_DISTANCES:
            continue

        # Skip records without valid gender (relay teams have #nT format)
        if not gender:
            continue

        result = {
            "year": row["year"],
            "tournament_name": row["tournament_name"],
            "event_date": parse_event_date(row["event_date"]),
            "gender": gender,
            "distance_m": distance,
            "stroke": stroke,
            "round": extract_round(row["style"]),
            "age": row["age"] if row["age"] and row["age"] > 0 else None,
            "swimmer_name": row["swimmer_name"],
            "swimmer_name_norm": normalize_name(row["swimmer_name"]),
            "team_code": row["team"],
            "rank": row["rank"] if row["rank"] and row["rank"] > 0 else None,
            "final_time_ms": final_time_ms,
            "seed_time_ms": parse_time_to_ms(row["seed_time"]),
            "source": "FECNA",
        }
        results.append(result)

    conn.close()
    return results


def get_fecna_stats(db_path: str | Path) -> dict[str, Any]:
    """Get statistics about the FECNA database.

    Returns:
        Dictionary with database statistics
    """
    db_path = Path(db_path)
    if not db_path.exists():
        raise FileNotFoundError(f"Database file not found: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Total records
    cursor.execute("SELECT COUNT(*) FROM results")
    total = cursor.fetchone()[0]

    # Valid records (with parseable time, excluding invalid times)
    cursor.execute("""
        SELECT COUNT(*) FROM results
        WHERE final_time IS NOT NULL
          AND final_time != ''
          AND final_time NOT IN ('NT', 'DQ', 'DNS', 'DNF', 'NS')
    """)
    valid = cursor.fetchone()[0]

    # Date range
    cursor.execute("SELECT MIN(event_date), MAX(event_date) FROM results")
    date_range = cursor.fetchone()

    # Unique swimmers
    cursor.execute("SELECT COUNT(DISTINCT swimmer_name) FROM results")
    swimmers = cursor.fetchone()[0]

    # Unique tournaments
    cursor.execute("SELECT COUNT(DISTINCT tournament_name) FROM results")
    tournaments = cursor.fetchone()[0]

    conn.close()

    return {
        "total_records": total,
        "valid_records": valid,
        "date_range": {
            "first": date_range[0],
            "last": date_range[1],
        },
        "unique_swimmers": swimmers,
        "unique_tournaments": tournaments,
    }


async def import_to_supabase(
    supabase: Client,
    results: list[dict[str, Any]],
    batch_size: int = 500,
) -> dict[str, int]:
    """Import results to Supabase swim_competition_results table.

    Args:
        supabase: Supabase client instance
        results: List of result dictionaries
        batch_size: Number of records per batch insert

    Returns:
        Dictionary with import statistics
    """
    imported = 0
    errors = 0

    for i in range(0, len(results), batch_size):
        batch = results[i:i + batch_size]
        try:
            response = supabase.table("swim_competition_results").upsert(
                batch,
                on_conflict="year,tournament_name,swimmer_name,distance_m,stroke,final_time_ms",
            ).execute()
            imported += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"Error importing batch {i}: {e}")

    return {
        "imported": imported,
        "errors": errors,
        "total": len(results),
    }

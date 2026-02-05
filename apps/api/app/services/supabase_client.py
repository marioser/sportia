"""
Supabase client configuration for FastAPI.
Uses service role key for admin operations.
"""

import os
from supabase import create_client, Client
from functools import lru_cache

# Get environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dbnihrkysrjdvglsfavk.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


@lru_cache()
def get_supabase_admin() -> Client:
    """
    Get Supabase client with service role key for admin operations.
    This client bypasses Row Level Security (RLS) policies.
    """
    if not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY environment variable is not set")

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

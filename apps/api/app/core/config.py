from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "SPORTIA API"
    debug: bool = False

    # Supabase
    supabase_url: str
    supabase_key: str

    # DragonflyDB/Redis cache
    redis_url: str = "redis://localhost:6379"

    # Cache TTL (seconds)
    cache_ttl_rankings: int = 600  # 10 min
    cache_ttl_comparisons: int = 300  # 5 min

    class Config:
        env_file = ".env"


settings = Settings()

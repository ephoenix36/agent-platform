"""
Configuration settings for the API
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    # App Settings
    APP_NAME: str = "AI Agent Platform"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]
    
    # Database URLs
    DATABASE_URL: str = "postgresql://admin:admin123@localhost:5432/agent_platform"
    MONGO_URL: str = "mongodb://admin:admin123@localhost:27017"
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT Settings
    JWT_SECRET: str = "your-super-secret-jwt-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # LLM API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    
    # Feature Flags
    ENABLE_VOICE_ASSISTANT: bool = True
    ENABLE_MARKETPLACE: bool = True
    ENABLE_COMMUNITIES: bool = True
    
    # Sandbox Configuration
    SANDBOX_TIMEOUT_SECONDS: int = 30
    SANDBOX_MEMORY_LIMIT: str = "512M"
    SANDBOX_CPU_QUOTA: int = 50000
    
    # Free Tier Limits
    FREE_TIER_MAX_AGENTS: int = 3
    FREE_TIER_MAX_EXECUTIONS_PER_DAY: int = 100
    FREE_TIER_MAX_TOKENS_PER_DAY: int = 10000


settings = Settings()

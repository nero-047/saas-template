from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="COMPUTE_",
        case_sensitive=False,
        extra="ignore",
    )

    service_name: str = "compute"
    environment: Literal["development", "test", "staging", "production"] = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()

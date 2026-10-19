"""Конфигурация приложения (параметры окружения).

Параметры берутся из переменных окружения или файла ``.env``.
Пример без секретов см. в ``.env.example``.
"""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Приложение
    app_name: str = "Личный финучёт API"
    app_version: str = "0.1.0"
    debug: bool = False

    # База данных PostgreSQL
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/finance",
        description="URL подключения к PostgreSQL (asyncpg)",
    )

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    allowed_methods: List[str] = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ]
    allowed_headers: List[str] = ["Authorization", "Content-Type"]
    allow_credentials: bool = True


@lru_cache
def get_settings() -> Settings:
    """Кэшированный экземпляр настроек."""
    return Settings()


settings = get_settings()
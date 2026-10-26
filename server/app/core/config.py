"""Конфигурация приложения (pydantic-settings).

Параметры берутся из переменных окружения или файла ``.env``
(см. ``.env.example`` — пример настроек без секретов).
"""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Приложение
    app_name: str = "Личный финучёт API"
    app_version: str = "0.1.0"
    debug: bool = False
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"

    # База данных PostgreSQL
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/finance",
        description="URL подключения к PostgreSQL (asyncpg)",
    )
    db_auto_create: bool = Field(
        default=True,
        description="Создавать таблицы при старте (dev/демо); в production — Alembic",
    )

    # CORS
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    allowed_methods: list[str] = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ]
    allowed_headers: list[str] = ["Authorization", "Content-Type"]
    allow_credentials: bool = True

    @field_validator("allowed_origins", "allowed_methods", "allowed_headers", mode="before")
    @classmethod
    def _parse_csv(cls, value: object) -> object:
        """Позволяет задавать списки через запятую: ``A,B,C`` -> ``["A", "B", "C"]``."""
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Кэшированный экземпляр настроек."""
    return Settings()


settings = get_settings()

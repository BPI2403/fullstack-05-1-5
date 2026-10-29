"""Конфигурация приложения (pydantic-settings).

Параметры берутся из переменных окружения или файла ``.env``
(см. ``.env.example`` — пример настроек без секретов).
"""

from functools import lru_cache

from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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

    # Аутентификация (JWT)
    # Значение по умолчанию — только для локальной разработки и тестов;
    # в реальном окружении задайте JWT_SECRET_KEY в .env.
    jwt_secret_key: str = Field(
        default="dev-secret-change-me",
        description="Секрет для подписи JWT access token",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    # NoDecode: pydantic-settings не пытается разобрать строку как JSON;
    # разделённый запятыми список разбирает валидатор ниже.
    allowed_origins: Annotated[list[str], NoDecode] = [
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

"""Подключение к базе данных и сессии SQLAlchemy (async)."""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.config import settings

# Асинхронный движок SQLAlchemy (driver asyncpg)
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

# Фабрика сессий
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Базовый класс для декларативных моделей
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Зависимость FastAPI: 제공ляет асинхронную сессию БД.

    Сессия закрывается автоматически после завершения запроса.
    При ошибке выполняется откат транзакции.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
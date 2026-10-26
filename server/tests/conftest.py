"""Фикстуры тестов: in-memory SQLite, Unit of Work, HTTP-клиент.

Тесты не требуют внешней PostgreSQL: используется in-memory SQLite
(aiosqlite), поверх которой разворачиваются Unit of Work и сервисы —
проверяется та же архитектура, что и в production, только на SQLite.
"""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.db.base import Base
from app.db.unit_of_work import UnitOfWork

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL)
TestingSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    """Каждый тест получает чистую схему БД."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def uow() -> AsyncGenerator[UnitOfWork, None]:
    """Unit of Work поверх тестовой БД."""
    async with UnitOfWork(TestingSessionLocal) as uow:
        yield uow
        await uow.rollback()


@pytest.fixture
async def client(uow: UnitOfWork) -> AsyncGenerator[AsyncClient, None]:
    """HTTP-клиент поверх приложения с подменённым Unit of Work."""
    from app.api.deps import get_uow
    from app.main import create_app

    app = create_app()

    async def override_get_uow() -> AsyncGenerator[UnitOfWork, None]:
        yield uow

    app.dependency_overrides[get_uow] = override_get_uow

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()

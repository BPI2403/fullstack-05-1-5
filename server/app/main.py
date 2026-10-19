"""Точка входа FastAPI-приложения.

Создаёт приложение, настраивает CORS, подключает роутеры API
 и создаёт таблицы БД при старте (для разработки и демонстрации).
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.router import budgets, categories, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы при старте (для dev/демо; в production используйте Alembic).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=settings.allow_credentials,
        allow_methods=settings.allowed_methods,
        allow_headers=settings.allowed_headers,
    )

    app.include_router(categories.router)
    app.include_router(transactions.router)
    app.include_router(budgets.router)

    @app.get("/", summary="Проверка работы API")
    async def root():
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "ok",
        }

    @app.get("/health", summary="Проверка здоровья сервиса")
    async def health():
        return {"status": "healthy"}

    return app


app = create_app()
"""Health-check маршруты (liveness/readiness пробы)."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.db.session import engine

router = APIRouter(prefix="/health", tags=["Service"])


@router.get("/live", summary="Liveness-проба: процесс жив")
async def liveness() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/ready", summary="Readiness-проба: БД доступна")
async def readiness() -> dict[str, str]:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="База данных недоступна",
        ) from exc
    return {"status": "ready"}

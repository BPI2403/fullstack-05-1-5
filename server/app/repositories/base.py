"""Базовый generic-репозиторий поверх SQLAlchemy."""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base


class BaseRepository[ModelT: Base]:
    """Data-access для одной таблицы.

    Содержит только работу с запросами; бизнес-правила — в сервисах
    (``app.services``), транзакциями управляет Unit of Work.
    """

    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, entity_id: int) -> ModelT | None:
        """Возвращает запись по первичному ключу или ``None``."""
        return await self.session.get(self.model, entity_id)

    async def list(self, *, limit: int = 100, offset: int = 0) -> Sequence[ModelT]:
        """Все записи таблицы с пагинацией, упорядоченные по id."""
        stmt = (
            select(self.model)
            .order_by(self.model.id)
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    def add(self, entity: ModelT) -> ModelT:
        """Ставит запись в сессию (коммит делает Unit of Work)."""
        self.session.add(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        """Удаляет запись из сессии (коммит делает Unit of Work)."""
        await self.session.delete(entity)

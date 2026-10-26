"""Репозиторий транзакций."""

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select

from app.models.enums import FinanceType
from app.models.transaction import Transaction
from app.repositories.base import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):
    """Доступ к таблице ``transactions``."""

    model = Transaction

    async def list_filtered(
        self,
        *,
        type_: FinanceType | None = None,
        category_id: int | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Transaction]:
        """Транзакции с опциональными фильтрами, новые — первыми."""
        stmt = select(Transaction)
        if type_ is not None:
            stmt = stmt.where(Transaction.type == type_)
        if category_id is not None:
            stmt = stmt.where(Transaction.category_id == category_id)
        if start_date is not None:
            stmt = stmt.where(Transaction.date >= start_date)
        if end_date is not None:
            stmt = stmt.where(Transaction.date <= end_date)
        stmt = (
            stmt.order_by(Transaction.date.desc(), Transaction.id.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

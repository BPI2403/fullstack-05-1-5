"""Репозиторий бюджетов."""

from collections.abc import Sequence

from sqlalchemy import select

from app.models.budget import Budget
from app.repositories.base import BaseRepository


class BudgetRepository(BaseRepository[Budget]):
    """Доступ к таблице ``budgets``."""

    model = Budget

    async def get_by_category_and_month(self, category_id: int, month: str) -> Budget | None:
        """Ищет бюджет по уникальной паре (category_id, month)."""
        stmt = select(Budget).where(
            Budget.category_id == category_id,
            Budget.month == month,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_filtered(
        self,
        *,
        month: str | None = None,
        category_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Budget]:
        """Бюджеты с опциональными фильтрами, свежие месяцы — первыми."""
        stmt = select(Budget)
        if month is not None:
            stmt = stmt.where(Budget.month == month)
        if category_id is not None:
            stmt = stmt.where(Budget.category_id == category_id)
        stmt = stmt.order_by(Budget.month.desc(), Budget.id.desc()).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return result.scalars().all()

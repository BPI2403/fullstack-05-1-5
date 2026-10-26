"""Репозиторий категорий."""

from sqlalchemy import select

from app.models.category import Category
from app.models.enums import FinanceType
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    """Доступ к таблице ``categories``."""

    model = Category

    async def get_by_name_and_type(self, name: str, type_: FinanceType) -> Category | None:
        """Ищет категорию по уникальной паре (name, type)."""
        stmt = select(Category).where(Category.name == name, Category.type == type_)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

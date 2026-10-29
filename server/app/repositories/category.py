"""Репозиторий категорий (запросы всегда ограничены пользователем)."""

from collections.abc import Sequence

from sqlalchemy import select

from app.models.category import Category
from app.models.enums import FinanceType
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    """Доступ к таблице ``categories`` в пределах одного пользователя."""

    model = Category

    async def get_for_user(self, category_id: int, user_id: int) -> Category | None:
        """Категория пользователя по id; чужие категории не видны."""
        stmt = select(Category).where(Category.id == category_id, Category.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(
        self, user_id: int, *, limit: int = 100, offset: int = 0
    ) -> Sequence[Category]:
        """Категории пользователя с пагинацией."""
        stmt = (
            select(Category)
            .where(Category.user_id == user_id)
            .order_by(Category.id)
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_name_and_type(
        self, name: str, type_: FinanceType, user_id: int
    ) -> Category | None:
        """Ищет категорию пользователя по уникальной паре (name, type)."""
        stmt = select(Category).where(
            Category.user_id == user_id,
            Category.name == name,
            Category.type == type_,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

"""CRUD-операции для категорий."""

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.exceptions import DuplicateError, NotFoundError
from app.models.base import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


async def create_category(session: AsyncSession, payload: CategoryCreate) -> Category:
    """Создать категорию."""
    category = Category(
        name=payload.name,
        type=payload.type,
        icon=payload.icon,
        color=payload.color,
    )
    session.add(category)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateError("Категория с такими параметрами уже существует") from exc
    await session.refresh(category)
    return category


async def get_category(session: AsyncSession, category_id: int) -> Category:
    """Получить категорию по id или выбросить NotFoundError."""
    result = await session.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if category is None:
        raise NotFoundError("Категория", category_id)
    return category


async def list_categories(session: AsyncSession) -> List[Category]:
    """Получить все категории."""
    result = await session.execute(select(Category).order_by(Category.id))
    return list(result.scalars().all())


async def update_category(
    session: AsyncSession, category_id: int, payload: CategoryUpdate
) -> Category:
    """Обновить категорию."""
    category = await get_category(session, category_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateError("Категория с такими параметрами уже существует") from exc
    await session.refresh(category)
    return category


async def delete_category(session: AsyncSession, category_id: int) -> None:
    """Удалить категорию (каскадно удалятся связанные транзакции и бюджеты)."""
    category = await get_category(session, category_id)
    await session.delete(category)
    await session.commit()
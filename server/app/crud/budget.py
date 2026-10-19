"""CRUD-операции для бюджетов."""

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.exceptions import DuplicateError, NotFoundError
from app.models.base import Budget, Category
from app.schemas.budget import BudgetCreate, BudgetUpdate


async def create_budget(session: AsyncSession, payload: BudgetCreate) -> Budget:
    """Создать бюджет.

    Проверяет существование категории и отсутствие бюджета для той же категории
    и того же месяца.
    """
    result = await session.execute(select(Category).where(Category.id == payload.category_id))
    category = result.scalar_one_or_none()
    if category is None:
        raise NotFoundError("Категория", payload.category_id)

    # Проверка уникальности пары (category_id, month)
    existing = await session.execute(
        select(Budget).where(
            Budget.category_id == payload.category_id,
            Budget.month == payload.month,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise DuplicateError(
            f"Бюджет для категории {payload.category_id} на месяц {payload.month} уже существует"
        )

    budget = Budget(
        category_id=payload.category_id,
        limit=payload.limit,
        month=payload.month,
    )
    session.add(budget)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateError("Бюджет с такими параметрами уже существует") from exc
    await session.refresh(budget)
    return budget


async def get_budget(session: AsyncSession, budget_id: int) -> Budget:
    """Получить бюджет по id или выбросить NotFoundError."""
    result = await session.execute(select(Budget).where(Budget.id == budget_id))
    budget = result.scalar_one_or_none()
    if budget is None:
        raise NotFoundError("Бюджет", budget_id)
    return budget


async def list_budgets(
    session: AsyncSession,
    month: Optional[str] = None,
    category_id: Optional[int] = None,
) -> List[Budget]:
    """Получить список бюджетов с опциональными фильтрами."""
    stmt = select(Budget).order_by(Budget.month.desc(), Budget.id)

    if month is not None:
        stmt = stmt.where(Budget.month == month)
    if category_id is not None:
        stmt = stmt.where(Budget.category_id == category_id)

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_budget(
    session: AsyncSession, budget_id: int, payload: BudgetUpdate
) -> Budget:
    """Обновить бюджет."""
    budget = await get_budget(session, budget_id)
    update_data = payload.model_dump(exclude_unset=True)

    category_id = update_data.pop("category_id", None)
    if category_id is not None:
        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise NotFoundError("Категория", category_id)
        budget.category_id = category_id

    for field, value in update_data.items():
        setattr(budget, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateError("Бюджет с такими параметрами уже существует") from exc
    await session.refresh(budget)
    return budget


async def delete_budget(session: AsyncSession, budget_id: int) -> None:
    """Удалить бюджет по id."""
    budget = await get_budget(session, budget_id)
    await session.delete(budget)
    await session.commit()
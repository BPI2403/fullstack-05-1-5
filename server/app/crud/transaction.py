"""CRUD-операции для транзакций."""

from datetime import date
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.exceptions import NotFoundError
from app.models.base import Category, Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


async def create_transaction(session: AsyncSession, payload: TransactionCreate) -> Transaction:
    """Создать транзакцию.

    Проверяет существование связанной категории (внешний ключ).
    """
    # Проверяем, что категория существует (FK проверка на уровне БД,
    # но даём понятное сообщение об ошибке до попытки вставки).
    result = await session.execute(select(Category).where(Category.id == payload.category_id))
    category = result.scalar_one_or_none()
    if category is None:
        raise NotFoundError("Категория", payload.category_id)

    transaction = Transaction(
        type=payload.type,
        amount=payload.amount,
        category_id=payload.category_id,
        date=payload.date,
        description=payload.description,
    )
    session.add(transaction)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise NotFoundError("Категория", payload.category_id) from exc
    await session.refresh(transaction)
    return transaction


async def get_transaction(session: AsyncSession, transaction_id: int) -> Transaction:
    """Получить транзакцию по id или выбросить NotFoundError."""
    result = await session.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise NotFoundError("Транзакция", transaction_id)
    return transaction


async def list_transactions(
    session: AsyncSession,
    type_filter: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[Transaction]:
    """Получить список транзакций с опциональными фильтрами."""
    stmt = select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc())

    if type_filter is not None:
        stmt = stmt.where(Transaction.type == type_filter)
    if category_id is not None:
        stmt = stmt.where(Transaction.category_id == category_id)
    if start_date is not None:
        stmt = stmt.where(Transaction.date >= start_date)
    if end_date is not None:
        stmt = stmt.where(Transaction.date <= end_date)

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_transaction(
    session: AsyncSession, transaction_id: int, payload: TransactionUpdate
) -> Transaction:
    """Обновить транзакцию."""
    transaction = await get_transaction(session, transaction_id)
    update_data = payload.model_dump(exclude_unset=True)

    category_id = update_data.pop("category_id", None)
    if category_id is not None:
        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise NotFoundError("Категория", category_id)
        transaction.category_id = category_id

    for field, value in update_data.items():
        setattr(transaction, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise NotFoundError("Категория", category_id or transaction.category_id) from exc
    await session.refresh(transaction)
    return transaction


async def delete_transaction(session: AsyncSession, transaction_id: int) -> None:
    """Удалить транзакцию по id."""
    transaction = await get_transaction(session, transaction_id)
    await session.delete(transaction)
    await session.commit()
"""Сервис транзакций: бизнес-логика поверх репозитория."""

from collections.abc import Sequence
from datetime import date

from sqlalchemy.exc import IntegrityError

from app.core.exceptions import NotFoundError
from app.db.unit_of_work import UnitOfWork
from app.models.enums import FinanceType
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    """Бизнес-операции с транзакциями."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def create(self, payload: TransactionCreate) -> Transaction:
        """Создаёт транзакцию; категория должна существовать."""
        await self._ensure_category_exists(payload.category_id)

        transaction = Transaction(
            type=payload.type,
            amount=payload.amount,
            category_id=payload.category_id,
            date=payload.date,
            description=payload.description,
        )
        self._uow.transactions.add(transaction)
        await self._commit_or_rollback(transaction)
        return transaction

    async def get(self, transaction_id: int) -> Transaction:
        """Возвращает транзакцию или выбрасывает ``NotFoundError``."""
        transaction = await self._uow.transactions.get(transaction_id)
        if transaction is None:
            raise NotFoundError("Транзакция", transaction_id)
        return transaction

    async def list(
        self,
        *,
        type_: FinanceType | None = None,
        category_id: int | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Transaction]:
        """Список транзакций с фильтрами и пагинацией."""
        return await self._uow.transactions.list_filtered(
            type_=type_,
            category_id=category_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )

    async def update(self, transaction_id: int, payload: TransactionUpdate) -> Transaction:
        """Частично обновляет транзакцию (в т.ч. перенос в другую категорию)."""
        transaction = await self.get(transaction_id)
        update_data = payload.model_dump(exclude_unset=True)

        new_category_id = update_data.pop("category_id", None)
        if new_category_id is not None:
            await self._ensure_category_exists(new_category_id)
            transaction.category_id = new_category_id

        for field, value in update_data.items():
            setattr(transaction, field, value)

        await self._commit_or_rollback(transaction)
        return transaction

    async def delete(self, transaction_id: int) -> None:
        """Удаляет транзакцию."""
        transaction = await self.get(transaction_id)
        await self._uow.transactions.delete(transaction)
        await self._uow.commit()

    async def _ensure_category_exists(self, category_id: int) -> None:
        if await self._uow.categories.get(category_id) is None:
            raise NotFoundError("Категория", category_id)

    async def _commit_or_rollback(self, transaction: Transaction) -> None:
        """Коммитит изменения; IntegrityError в БД переводит в NotFoundError."""
        try:
            await self._uow.commit()
        except IntegrityError as exc:
            # Единственный реальный IntegrityError здесь — битый внешний ключ.
            await self._uow.rollback()
            raise NotFoundError("Категория", transaction.category_id) from exc
        await self._uow.session.refresh(transaction)

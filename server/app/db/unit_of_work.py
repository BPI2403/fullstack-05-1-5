"""Unit of Work — транзакционная граница бизнес-операций.

Все репозитории внутри одного экземпляра ``UnitOfWork`` работают
с одной сессией SQLAlchemy: успешное завершение операции фиксируется
через ``commit``, при ошибке выполняется ``rollback``.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.repositories.budget import BudgetRepository
from app.repositories.category import CategoryRepository
from app.repositories.refresh_session import RefreshSessionRepository
from app.repositories.transaction import TransactionRepository
from app.repositories.user import UserRepository


class UnitOfWork:
    """Единица работы поверх асинхронной сессии SQLAlchemy."""

    session: AsyncSession
    categories: CategoryRepository
    transactions: TransactionRepository
    budgets: BudgetRepository
    users: UserRepository
    refresh_sessions: RefreshSessionRepository

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def __aenter__(self) -> "UnitOfWork":
        self.session = self._session_factory()
        self.categories = CategoryRepository(self.session)
        self.transactions = TransactionRepository(self.session)
        self.budgets = BudgetRepository(self.session)
        self.users = UserRepository(self.session)
        self.refresh_sessions = RefreshSessionRepository(self.session)
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc_type is not None:
            await self.rollback()
        await self.session.close()

    async def commit(self) -> None:
        """Фиксирует транзакцию текущей бизнес-операции."""
        await self.session.commit()

    async def rollback(self) -> None:
        """Откатывает незакоммиченные изменения."""
        await self.session.rollback()

"""Зависимости FastAPI: Unit of Work и сервисы (constructor injection)."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends

from app.db.session import session_factory
from app.db.unit_of_work import UnitOfWork
from app.services.budget import BudgetService
from app.services.category import CategoryService
from app.services.transaction import TransactionService


async def get_uow() -> AsyncIterator[UnitOfWork]:
    """Открывает Unit of Work на время запроса (rollback + close в конце)."""
    async with UnitOfWork(session_factory) as uow:
        yield uow


UnitOfWorkDep = Annotated[UnitOfWork, Depends(get_uow)]


def get_category_service(uow: UnitOfWorkDep) -> CategoryService:
    return CategoryService(uow)


def get_transaction_service(uow: UnitOfWorkDep) -> TransactionService:
    return TransactionService(uow)


def get_budget_service(uow: UnitOfWorkDep) -> BudgetService:
    return BudgetService(uow)


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
TransactionServiceDep = Annotated[TransactionService, Depends(get_transaction_service)]
BudgetServiceDep = Annotated[BudgetService, Depends(get_budget_service)]

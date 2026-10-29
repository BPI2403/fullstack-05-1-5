"""Зависимости FastAPI: Unit of Work, сервисы, текущий пользователь."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import session_factory
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.services.auth import AuthService
from app.services.budget import BudgetService
from app.services.category import CategoryService
from app.services.transaction import TransactionService

# auto_error=False: отсутствующий заголовок обрабатываем сами (единый 401).
_bearer = HTTPBearer(auto_error=False)


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


def get_auth_service(uow: UnitOfWorkDep) -> AuthService:
    return AuthService(uow)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    uow: UnitOfWorkDep,
) -> User:
    """Извлекает пользователя из Bearer access token.

    Публичные маршруты не используют эту зависимость; защищённые
    маршруты получают проверенного пользователя или 401.
    """
    if credentials is None:
        raise UnauthorizedError("Требуется авторизация")
    user_id = decode_access_token(credentials.credentials)
    return await AuthService(uow).get_user(user_id)


CurrentUserDep = Annotated[User, Depends(get_current_user)]


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
TransactionServiceDep = Annotated[TransactionService, Depends(get_transaction_service)]
BudgetServiceDep = Annotated[BudgetService, Depends(get_budget_service)]

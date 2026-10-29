"""Сервис аутентификации: регистрация, вход, обновление и отзыв токенов."""

from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    refresh_token_hash,
    verify_password,
)
from app.db.unit_of_work import UnitOfWork
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    """Бизнес-операции аутентификации."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def register(self, payload: RegisterRequest) -> tuple[User, TokenResponse]:
        """Создаёт пользователя и сразу выдаёт пару токенов."""
        duplicate = await self._uow.users.get_by_email(payload.email)
        if duplicate is not None:
            raise ConflictError("Пользователь с таким email уже зарегистрирован")

        user = User(
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            display_name=payload.display_name,
        )
        self._uow.users.add(user)
        try:
            await self._uow.commit()
        except IntegrityError as exc:
            await self._uow.rollback()
            raise ConflictError("Пользователь с таким email уже зарегистрирован") from exc

        tokens = await self._start_session(user)
        return user, tokens

    async def login(self, payload: LoginRequest) -> tuple[User, TokenResponse]:
        """Проверяет учётные данные и выдаёт пару токенов."""
        user = await self._uow.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            # Единое сообщение не раскрывает, существует ли такой email.
            raise UnauthorizedError("Неверный email или пароль")
        if not user.is_active:
            raise UnauthorizedError("Учётная запись отключена")

        tokens = await self._start_session(user)
        return user, tokens

    async def refresh(self, refresh_token: str) -> tuple[User, TokenResponse]:
        """Выдаёт новый access token по действующему refresh token.

        Недействительный (неизвестный), истёкший или отозванный
        refresh token отклоняется. Сессия ротируется: прежний refresh
        token отзывается и выдаётся новая пара токенов.
        """
        token_hash = refresh_token_hash(refresh_token)
        session = await self._uow.refresh_sessions.get_by_token_hash(token_hash)
        if session is None:
            raise UnauthorizedError("Refresh token недействителен, истёк или отозван")

        user = await self._uow.users.get(session.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("Требуется авторизация")

        await self._uow.refresh_sessions.revoke(token_hash)
        tokens = await self._start_session(user)
        return user, tokens

    async def logout(self, refresh_token: str) -> None:
        """Отзывает refresh token текущей сессии (идемпотентно)."""
        await self._uow.refresh_sessions.revoke(refresh_token_hash(refresh_token))
        await self._uow.commit()

    async def get_user(self, user_id: int) -> User:
        """Возвращает активного пользователя по id (для /auth/me)."""
        user = await self._uow.users.get(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("Требуется авторизация")
        return user

    async def _start_session(self, user: User) -> TokenResponse:
        """Создаёт refresh-сессию и возвращает пару токенов."""
        token = create_refresh_token()
        session = RefreshSession(
            user_id=user.id,
            token_hash=refresh_token_hash(token),
            expires_at=datetime.now(UTC)
            + timedelta(days=settings.refresh_token_expire_days),
        )
        self._uow.refresh_sessions.add(session)
        await self._uow.commit()
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=token,
            expires_in=settings.access_token_expire_minutes * 60,
        )

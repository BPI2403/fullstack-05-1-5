"""Хеширование паролей и работа с JWT.

Пароли хешируются bcrypt (алгоритм, предназначенный для хранения
паролей, с солью и настраиваемой стоимостью). Access token — JWT
HS256 с ограниченным сроком действия. Refresh token — случайная
строка; в БД хранится только её SHA-256 хеш.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

_BCRYPT_ROUNDS = 12
_REFRESH_TOKEN_BYTES = 48


def hash_password(password: str) -> str:
    """Возвращает bcrypt-хеш пароля."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode(
        "utf-8"
    )


def verify_password(password: str, password_hash: str) -> bool:
    """Проверяет пароль против сохранённого bcrypt-хеша."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    """Создаёт JWT access token с ограниченным сроком действия."""
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    """Декодирует access token и возвращает id пользователя.

    Бросает ``UnauthorizedError`` для просроченного, поддельного
    или предназначенного для другого потока использования токена.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Требуется авторизация") from exc

    if payload.get("type") != "access":
        raise UnauthorizedError("Требуется авторизация")
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise UnauthorizedError("Требуется авторизация") from exc
    return user_id


def create_refresh_token() -> str:
    """Создаёт криптостойкий случайный refresh token."""
    return secrets.token_urlsafe(_REFRESH_TOKEN_BYTES)


def refresh_token_hash(token: str) -> str:
    """SHA-256 хеш refresh token для хранения в БД."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

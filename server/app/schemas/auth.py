"""Схемы аутентификации и пользователя."""

from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema


class RegisterRequest(BaseSchema):
    """Данные регистрации нового пользователя."""

    email: EmailStr = Field(examples=["user@example.com"])
    # Минимум 8 символов: требование к стойкости пароля.
    password: str = Field(min_length=8, max_length=128, examples=["s3cretPass!"])
    display_name: str | None = Field(default=None, max_length=100, examples=["Алексей"])


class LoginRequest(BaseSchema):
    """Данные для входа."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseSchema):
    """Запрос нового access token по refresh token."""

    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseSchema):
    """Выход: refresh token текущей сессии."""

    refresh_token: str = Field(min_length=1)


class TokenResponse(BaseSchema):
    """Пара токенов доступа и обновления."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Время жизни access token, секунд")


class UserResponse(BaseSchema):
    """Пользователь в ответе API (без хеша пароля)."""

    id: int
    email: EmailStr
    display_name: str | None
    created_at: datetime


class AuthResponse(TokenResponse):
    """Пара токенов вместе с данными пользователя (после входа/регистрации)."""

    user: UserResponse

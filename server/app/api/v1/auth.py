"""Маршруты аутентификации: регистрация, вход, обновление и выход."""

from fastapi import APIRouter, status

from app.api.deps import AuthServiceDep, CurrentUserDep
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Зарегистрировать пользователя",
)
async def register(payload: RegisterRequest, service: AuthServiceDep) -> AuthResponse:
    user, tokens = await service.register(payload)
    return AuthResponse(
        **tokens.model_dump(), user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=AuthResponse, summary="Войти")
async def login(payload: LoginRequest, service: AuthServiceDep) -> AuthResponse:
    user, tokens = await service.login(payload)
    return AuthResponse(
        **tokens.model_dump(), user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse, summary="Обновить access token")
async def refresh(payload: RefreshRequest, service: AuthServiceDep) -> TokenResponse:
    """Принимает действующий refresh token и возвращает новую пару токенов."""
    _, tokens = await service.refresh(payload.refresh_token)
    return tokens


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Выйти: отозвать refresh token сессии",
)
async def logout(payload: LogoutRequest, service: AuthServiceDep) -> None:
    """Отзывает refresh token; после этого обновление access token невозможно."""
    await service.logout(payload.refresh_token)


@router.get("/me", response_model=UserResponse, summary="Текущий пользователь")
async def me(user: CurrentUserDep) -> UserResponse:
    """Возвращает пользователя по access token (защищённый маршрут)."""
    return UserResponse.model_validate(user)

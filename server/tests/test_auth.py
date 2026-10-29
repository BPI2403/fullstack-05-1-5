"""Тесты аутентификации: регистрация, вход, токены, выход, владение данными."""

import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import refresh_token_hash
from app.db.unit_of_work import UnitOfWork
from app.models.refresh_session import RefreshSession
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth import AuthService

AUTH = "/api/v1/auth"


# ---------------- Сервис ----------------


async def test_register_creates_user_and_tokens(uow: UnitOfWork):
    user, tokens = await AuthService(uow).register(
        RegisterRequest(email="User@Example.com", password="password123", display_name="Аня")
    )
    assert user.id is not None
    # email нормализуется к нижнему регистру
    assert user.email == "user@example.com"
    # пароль хранится в виде bcrypt-хеша, не в открытом виде
    assert user.password_hash.startswith("$2")
    assert "password123" not in user.password_hash
    assert tokens.access_token.count(".") == 2  # JWT из трёх частей
    assert tokens.refresh_token


async def test_register_duplicate_email(uow: UnitOfWork):
    service = AuthService(uow)
    await service.register(RegisterRequest(email="a@example.com", password="password123"))
    with pytest.raises(ConflictError):
        await service.register(RegisterRequest(email="a@example.com", password="password456"))


async def test_login_success_and_wrong_password(uow: UnitOfWork):
    service = AuthService(uow)
    await service.register(RegisterRequest(email="b@example.com", password="password123"))

    user, tokens = await service.login(
        LoginRequest(email="b@example.com", password="password123")
    )
    assert tokens.access_token

    with pytest.raises(UnauthorizedError):
        await service.login(LoginRequest(email="b@example.com", password="wrong-password"))
    with pytest.raises(UnauthorizedError):
        # Чужой email не раскрывается: то же сообщение об ошибке.
        await service.login(LoginRequest(email="ghost@example.com", password="password123"))


async def test_refresh_rotates_and_revokes_old_token(uow: UnitOfWork):
    service = AuthService(uow)
    _, tokens = await service.register(
        RegisterRequest(email="c@example.com", password="password123")
    )

    user, new_tokens = await service.refresh(tokens.refresh_token)
    # Ротация: refresh token всегда новый (access token может совпасть,
    # если выпущен в ту же секунду — JWT содержит время с точностью до секунды).
    assert new_tokens.refresh_token != tokens.refresh_token

    # Старый refresh token отозван ротацией — второй раз уже не работает.
    with pytest.raises(UnauthorizedError):
        await service.refresh(tokens.refresh_token)
    # Новый продолжает работать.
    await service.refresh(new_tokens.refresh_token)
    assert user.email == "c@example.com"


async def test_refresh_rejects_garbage_token(uow: UnitOfWork):
    with pytest.raises(UnauthorizedError):
        await AuthService(uow).refresh("not-a-real-token")


async def test_refresh_rejects_revoked_token(uow: UnitOfWork):
    service = AuthService(uow)
    _, tokens = await service.register(
        RegisterRequest(email="d@example.com", password="password123")
    )
    await service.logout(tokens.refresh_token)

    with pytest.raises(UnauthorizedError):
        await service.refresh(tokens.refresh_token)
    # Выход идемпотентен: повторный logout не падает.
    await service.logout(tokens.refresh_token)


async def test_refresh_rejects_expired_token(uow: UnitOfWork):
    """Истёкшая сессия отклоняется даже при живом значении токена."""
    service = AuthService(uow)
    user, tokens = await service.register(
        RegisterRequest(email="e@example.com", password="password123")
    )
    uow.refresh_sessions.add(
        RefreshSession(
            user_id=user.id,
            token_hash=refresh_token_hash("expired-token"),
            expires_at=__import__("datetime").datetime(
                2020, 1, 1, tzinfo=__import__("datetime").UTC
            ),
        )
    )
    await uow.commit()
    with pytest.raises(UnauthorizedError):
        await service.refresh("expired-token")


async def test_access_token_expiry_configured():
    """Сроки действия токенов заданы в настройках."""
    assert settings.access_token_expire_minutes > 0
    assert settings.refresh_token_expire_days > settings.access_token_expire_minutes / (60 * 24)


# ---------------- API ----------------


async def test_api_register_login_refresh_logout(client: AsyncClient):
    # Регистрация возвращает токены и пользователя
    resp = await client.post(
        f"{AUTH}/register",
        json={"email": "e2e@example.com", "password": "password123", "display_name": "Ева"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["access_token"] and data["refresh_token"]
    assert data["user"]["email"] == "e2e@example.com"
    assert "password_hash" not in data["user"]

    headers = {"Authorization": f"Bearer {data['access_token']}"}

    # Текущий пользователь по access token
    resp = await client.get(f"{AUTH}/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "e2e@example.com"

    # Обновление access token по refresh token
    resp = await client.post(f"{AUTH}/refresh", json={"refresh_token": data["refresh_token"]})
    assert resp.status_code == 200
    new_tokens = resp.json()
    assert new_tokens["refresh_token"] != data["refresh_token"]  # ротация

    # Старый refresh token больше не работает
    resp = await client.post(f"{AUTH}/refresh", json={"refresh_token": data["refresh_token"]})
    assert resp.status_code == 401

    # Выход отзывает refresh token текущей сессии
    resp = await client.post(
        f"{AUTH}/logout", json={"refresh_token": new_tokens["refresh_token"]}
    )
    assert resp.status_code == 204
    resp = await client.post(
        f"{AUTH}/refresh", json={"refresh_token": new_tokens["refresh_token"]}
    )
    assert resp.status_code == 401


async def test_api_login_wrong_password(client: AsyncClient):
    await client.post(
        f"{AUTH}/register", json={"email": "f@example.com", "password": "password123"}
    )
    resp = await client.post(
        f"{AUTH}/login", json={"email": "f@example.com", "password": "wrong-password"}
    )
    assert resp.status_code == 401


async def test_api_me_requires_token(client: AsyncClient):
    resp = await client.get(f"{AUTH}/me")
    assert resp.status_code == 401


async def test_api_me_rejects_garbage_token(client: AsyncClient):
    resp = await client.get(f"{AUTH}/me", headers={"Authorization": "Bearer garbage"})
    assert resp.status_code == 401


async def test_api_register_invalid_password(client: AsyncClient):
    resp = await client.post(
        f"{AUTH}/register", json={"email": "g@example.com", "password": "short"}
    )
    assert resp.status_code == 422


async def test_api_register_duplicate_email(client: AsyncClient):
    payload = {"email": "h@example.com", "password": "password123"}
    resp = await client.post(f"{AUTH}/register", json=payload)
    assert resp.status_code == 201
    resp = await client.post(f"{AUTH}/register", json=payload)
    assert resp.status_code == 409


async def test_api_data_isolated_between_users(client: AsyncClient):
    """Пользователь B не видит и не может изменить данные пользователя A."""

    async def register_user(email: str) -> dict[str, str]:
        resp = await client.post(
            f"{AUTH}/register", json={"email": email, "password": "password123"}
        )
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    async def create_category(headers: dict[str, str]) -> int:
        resp = await client.post(
            "/api/v1/categories", json={"name": "Еда", "type": "expense"}, headers=headers
        )
        return resp.json()["id"]

    headers_a = await register_user("user-a@example.com")
    headers_b = await register_user("user-b@example.com")
    category_a = await create_category(headers_a)

    # Списки изолированы
    resp = await client.get("/api/v1/categories", headers=headers_b)
    assert resp.json() == []
    resp = await client.get("/api/v1/categories", headers=headers_a)
    assert len(resp.json()) == 1

    # Прямой доступ и изменение чужого ресурса дают 404
    resp = await client.get(f"/api/v1/categories/{category_a}", headers=headers_b)
    assert resp.status_code == 404
    resp = await client.patch(
        f"/api/v1/categories/{category_a}", json={"name": "Взломано"}, headers=headers_b
    )
    assert resp.status_code == 404
    resp = await client.delete(f"/api/v1/categories/{category_a}", headers=headers_b)
    assert resp.status_code == 404

    # Данные пользователя A не изменены
    resp = await client.get(f"/api/v1/categories/{category_a}", headers=headers_a)
    assert resp.json()["name"] == "Еда"

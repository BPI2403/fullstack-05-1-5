"""Тесты категорий: сервис (бизнес-правила) и API (HTTP)."""

import pytest

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import FinanceType
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.category import CategoryService

PREFIX = "/api/v1/categories"


@pytest.fixture
def service(uow) -> CategoryService:
    return CategoryService(uow)


async def test_create_category(service, user_id):
    category = await service.create(
        CategoryCreate(name="Зарплата", type=FinanceType.INCOME, icon="💼", color="#2563eb"),
        user_id,
    )
    assert category.id is not None
    assert category.name == "Зарплата"
    assert category.type == FinanceType.INCOME
    assert category.user_id == user_id


async def test_create_duplicate_conflict(service, user_id):
    await service.create(CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id)
    with pytest.raises(ConflictError):
        await service.create(CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id)


async def test_same_name_allowed_for_different_users(service, user_id):
    """Уникальность (name, type) действует внутри одного пользователя."""
    await service.create(CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id)
    category = await service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id + 1
    )
    assert category.user_id == user_id + 1


async def test_get_not_found(service, user_id):
    with pytest.raises(NotFoundError):
        await service.get(999, user_id)


async def test_update_and_delete_category(service, user_id):
    category = await service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE, icon="🍽️", color="#ef4444"),
        user_id,
    )

    updated = await service.update(category.id, CategoryUpdate(name="Продукты"), user_id)
    assert updated.name == "Продукты"
    assert updated.icon == "🍽️"  # не изменён

    await service.delete(category.id, user_id)
    with pytest.raises(NotFoundError):
        await service.get(category.id, user_id)


async def test_foreign_category_is_invisible(service, user_id):
    """Категория другого пользователя неотличима от несуществующей."""
    category = await service.create(CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id)
    with pytest.raises(NotFoundError):
        await service.get(category.id, user_id=user_id + 1)
    with pytest.raises(NotFoundError):
        await service.delete(category.id, user_id=user_id + 1)


# ---------------- API ----------------


async def test_api_requires_auth(client):
    resp = await client.get(f"{PREFIX}")
    assert resp.status_code == 401


async def test_api_create_and_list_category(client, auth_headers):
    resp = await client.post(
        f"{PREFIX}", json={"name": "Фриланс", "type": "income", "icon": "🖥️"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Фриланс"
    assert data["type"] == "income"
    assert "id" in data

    resp = await client.get(f"{PREFIX}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_api_get_update_delete_category(client, auth_headers):
    resp = await client.post(
        f"{PREFIX}", json={"name": "Одежда", "type": "expense"}, headers=auth_headers
    )
    cat_id = resp.json()["id"]

    resp = await client.get(f"{PREFIX}/{cat_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Одежда"

    resp = await client.patch(
        f"{PREFIX}/{cat_id}", json={"name": "Обувь"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Обувь"

    resp = await client.delete(f"{PREFIX}/{cat_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.get(f"{PREFIX}/{cat_id}", headers=auth_headers)
    assert resp.status_code == 404


async def test_api_not_found(client, auth_headers):
    resp = await client.get(f"{PREFIX}/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]


async def test_api_invalid_data(client, auth_headers):
    resp = await client.post(
        f"{PREFIX}", json={"name": "", "type": "income"}, headers=auth_headers
    )
    assert resp.status_code == 422


async def test_api_invalid_enum(client, auth_headers):
    # Неверный тип — отклоняется валидацией (enum вместо свободной строки)
    resp = await client.post(
        f"{PREFIX}", json={"name": "Тест", "type": "invalid"}, headers=auth_headers
    )
    assert resp.status_code == 422

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


async def test_create_category(service):
    category = await service.create(
        CategoryCreate(name="Зарплата", type=FinanceType.INCOME, icon="💼", color="#2563eb")
    )
    assert category.id is not None
    assert category.name == "Зарплата"
    assert category.type == FinanceType.INCOME


async def test_create_duplicate_conflict(service):
    await service.create(CategoryCreate(name="Еда", type=FinanceType.EXPENSE))
    with pytest.raises(ConflictError):
        await service.create(CategoryCreate(name="Еда", type=FinanceType.EXPENSE))


async def test_get_not_found(service):
    with pytest.raises(NotFoundError):
        await service.get(999)


async def test_update_and_delete_category(service):
    category = await service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE, icon="🍽️", color="#ef4444")
    )

    updated = await service.update(category.id, CategoryUpdate(name="Продукты"))
    assert updated.name == "Продукты"
    assert updated.icon == "🍽️"  # не изменён

    await service.delete(category.id)
    with pytest.raises(NotFoundError):
        await service.get(category.id)


# ---------------- API ----------------


async def test_api_create_and_list_category(client):
    resp = await client.post(
        f"{PREFIX}", json={"name": "Фриланс", "type": "income", "icon": "🖥️"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Фриланс"
    assert data["type"] == "income"
    assert "id" in data

    resp = await client.get(f"{PREFIX}")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_api_get_update_delete_category(client):
    resp = await client.post(f"{PREFIX}", json={"name": "Одежда", "type": "expense"})
    cat_id = resp.json()["id"]

    resp = await client.get(f"{PREFIX}/{cat_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Одежда"

    resp = await client.patch(f"{PREFIX}/{cat_id}", json={"name": "Обувь"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Обувь"

    resp = await client.delete(f"{PREFIX}/{cat_id}")
    assert resp.status_code == 204

    resp = await client.get(f"{PREFIX}/{cat_id}")
    assert resp.status_code == 404


async def test_api_not_found(client):
    resp = await client.get(f"{PREFIX}/99999")
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]


async def test_api_invalid_data(client):
    resp = await client.post(f"{PREFIX}", json={"name": "", "type": "income"})
    assert resp.status_code == 422


async def test_api_invalid_enum(client):
    # Неверный тип — отклоняется валидацией (enum вместо свободной строки)
    resp = await client.post(f"{PREFIX}", json={"name": "Тест", "type": "invalid"})
    assert resp.status_code == 422

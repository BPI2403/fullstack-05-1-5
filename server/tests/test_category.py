"""Тесты CRUD и API для категорий."""

from app.crud.category import create_category, delete_category, get_category, update_category
from app.crud.exceptions import NotFoundError
from app.models.base import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


async def test_create_category(db_session):
    category = await create_category(
        db_session,
        CategoryCreate(name="Зарплата", type="income", icon="💼", color="#2563eb"),
    )
    assert category.id is not None
    assert category.name == "Зарплата"
    assert category.type == "income"


async def test_get_category_not_found(db_session):
    try:
        await get_category(db_session, 999)
    except NotFoundError as exc:
        assert "Категория" in str(exc)
    else:
        raise AssertionError("Ожидалось NotFoundError")


async def test_update_category(db_session):
    category = await create_category(
        db_session,
        CategoryCreate(name="Еда", type="expense", icon="🍽️", color="#ef4444"),
    )
    updated = await update_category(
        db_session, category.id, CategoryUpdate(name="Продукты", type="expense")
    )
    assert updated.name == "Продукты"
    assert updated.type == "expense"
    assert updated.icon == "🍽️"  # не изменён


async def test_delete_category(db_session):
    category = await create_category(
        db_session, CategoryCreate(name="Временная", type="expense")
    )
    await delete_category(db_session, category.id)
    try:
        await get_category(db_session, category.id)
    except NotFoundError:
        pass
    else:
        raise AssertionError("Ожидалось NotFoundError после удаления")


async def test_api_create_and_list_category(client):
    resp = await client.post(
        "/categories/",
        json={"name": "Фриланс", "type": "income", "icon": "🖥️", "color": "#0ea5e0"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Фриланс"
    assert data["type"] == "income"
    assert "id" in data

    resp = await client.get("/categories/")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1


async def test_api_get_and_update_category(client):
    resp = await client.post(
        "/categories/",
        json={"name": "Одежда", "type": "expense", "icon": "👕", "color": "#db2727"},
    )
    cat_id = resp.json()["id"]

    resp = await client.get(f"/categories/{cat_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Одежда"

    resp = await client.patch(
        f"/categories/{cat_id}", json={"name": "Обувь"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Обувь"


async def test_api_delete_category(client):
    resp = await client.post(
        "/categories/", json={"name": "Удалить", "type": "expense"}
    )
    cat_id = resp.json()["id"]

    resp = await client.delete(f"/categories/{cat_id}")
    assert resp.status_code == 204

    resp = await client.get(f"/categories/{cat_id}")
    assert resp.status_code == 404


async def test_api_category_not_found(client):
    resp = await client.get("/categories/99999")
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]


async def test_api_category_invalid_data(client):
    # Пустое имя — ошибка валидации (422)
    resp = await client.post(
        "/categories/", json={"name": "", "type": "income"}
    )
    assert resp.status_code == 422
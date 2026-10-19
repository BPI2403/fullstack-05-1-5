"""Тесты CRUD и API для бюджетов (включая связанные категории)."""

from app.crud.budget import (
    create_budget,
    delete_budget,
    get_budget,
    list_budgets,
    update_budget,
)
from app.crud.category import create_category
from app.crud.exceptions import DuplicateError, NotFoundError
from app.models.base import Category
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.schemas.category import CategoryCreate


async def _make_category(session, name="Еда", type_="expense"):
    return await create_category(
        session, CategoryCreate(name=name, type=type_, icon="🍽️", color="#ef4444")
    )


async def test_create_budget_with_category(db_session):
    category = await _make_category(db_session)
    budget = await create_budget(
        db_session,
        BudgetCreate(category_id=category.id, limit=20000, month="2025-09"),
    )
    assert budget.id is not None
    assert budget.category_id == category.id
    assert budget.limit == 20000
    assert budget.month == "2025-09"


async def test_create_budget_unknown_category(db_session):
    try:
        await create_budget(
            db_session, BudgetCreate(category_id=99999, limit=1000, month="2025-09")
        )
    except NotFoundError as exc:
        assert "Категория" in str(exc)
    else:
        raise AssertionError("Ожидалось NotFoundError")


async def test_create_budget_duplicate_category_month(db_session):
    category = await _make_category(db_session)
    await create_budget(
        db_session, BudgetCreate(category_id=category.id, limit=20000, month="2025-09")
    )
    try:
        await create_budget(
            db_session, BudgetCreate(category_id=category.id, limit=30000, month="2025-09")
        )
    except DuplicateError as exc:
        assert "уже существует" in str(exc)
    else:
        raise AssertionError("Ожидалось DuplicateError")


async def test_get_and_update_budget(db_session):
    category = await _make_category(db_session)
    budget = await create_budget(
        db_session, BudgetCreate(category_id=category.id, limit=20000, month="2025-09")
    )
    updated = await update_budget(
        db_session, budget.id, BudgetUpdate(limit=25000)
    )
    assert updated.limit == 25000
    assert updated.month == "2025-09"


async def test_delete_budget(db_session):
    category = await _make_category(db_session)
    budget = await create_budget(
        db_session, BudgetCreate(category_id=category.id, limit=20000, month="2025-09")
    )
    await delete_budget(db_session, budget.id)
    try:
        await get_budget(db_session, budget.id)
    except NotFoundError:
        pass
    else:
        raise AssertionError("Ожидалось NotFoundError после удаления")


async def test_list_budgets_filter(db_session):
    category = await _make_category(db_session)
    await create_budget(
        db_session, BudgetCreate(category_id=category.id, limit=20000, month="2025-09")
    )
    await create_budget(
        db_session, BudgetCreate(category_id=category.id, limit=10000, month="2025-10")
    )

    budgets_09 = await list_budgets(db_session, month="2025-09")
    assert len(budgets_09) == 1
    assert budgets_09[0].month == "2025-09"


async def test_api_create_and_list_budget(client):
    resp = await client.post(
        "/categories/",
        json={"name": "Еда", "type": "expense", "icon": "🍽️", "color": "#ef4444"},
    )
    assert resp.status_code == 201
    category_id = resp.json()["id"]

    resp = await client.post(
        "/budgets/",
        json={
            "category_id": category_id,
            "limit": 20000,
            "month": "2025-09",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["category_id"] == category_id
    assert data["limit"] == 20000

    resp = await client.get("/budgets/")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1


async def test_api_budget_not_found(client):
    resp = await client.get("/budgets/99999")
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]


async def test_api_budget_duplicate(client):
    resp = await client.post(
        "/categories/",
        json={"name": "Развлечения", "type": "expense"},
    )
    category_id = resp.json()["id"]

    await client.post(
        "/budgets/",
        json={"category_id": category_id, "limit": 12000, "month": "2025-09"},
    )
    resp = await client.post(
        "/budgets/",
        json={"category_id": category_id, "limit": 15000, "month": "2025-09"},
    )
    assert resp.status_code == 400


async def test_api_budget_invalid_month(client):
    resp = await client.post(
        "/categories/",
        json={"name": "Еда", "type": "expense"},
    )
    category_id = resp.json()["id"]

    resp = await client.post(
        "/budgets/",
        json={
            "category_id": category_id,
            "limit": 1000,
            "month": "not-a-month",
        },
    )
    assert resp.status_code == 422
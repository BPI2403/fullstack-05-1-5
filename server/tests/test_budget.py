"""Тесты бюджетов: сервис, уникальность, каскад удаления, API."""

import pytest

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import FinanceType
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.schemas.category import CategoryCreate
from app.schemas.transaction import TransactionCreate
from app.services.budget import BudgetService
from app.services.category import CategoryService
from app.services.transaction import TransactionService

PREFIX = "/api/v1/budgets"


@pytest.fixture
def category_service(uow) -> CategoryService:
    return CategoryService(uow)


@pytest.fixture
def transaction_service(uow) -> TransactionService:
    return TransactionService(uow)


@pytest.fixture
def budget_service(uow) -> BudgetService:
    return BudgetService(uow)


async def test_create_budget_with_category(category_service, budget_service, user_id):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    budget = await budget_service.create(
        BudgetCreate(category_id=category.id, limit=20000, month="2025-09"), user_id
    )
    assert budget.id is not None
    assert budget.category_id == category.id
    assert budget.user_id == user_id


async def test_create_budget_unknown_category(budget_service, user_id):
    with pytest.raises(NotFoundError):
        await budget_service.create(
            BudgetCreate(category_id=99999, limit=1000, month="2025-09"), user_id
        )


async def test_create_budget_foreign_category(
    category_service, budget_service, user_id
):
    """Бюджет нельзя привязать к чужой категории."""
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    with pytest.raises(NotFoundError):
        await budget_service.create(
            BudgetCreate(category_id=category.id, limit=1000, month="2025-09"), user_id + 1
        )


async def test_create_duplicate_budget_conflict(
    category_service, budget_service, user_id
):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    await budget_service.create(
        BudgetCreate(category_id=category.id, limit=20000, month="2025-09"), user_id
    )
    with pytest.raises(ConflictError):
        await budget_service.create(
            BudgetCreate(category_id=category.id, limit=30000, month="2025-09"), user_id
        )


async def test_update_and_delete_budget(category_service, budget_service, user_id):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    budget = await budget_service.create(
        BudgetCreate(category_id=category.id, limit=20000, month="2025-09"), user_id
    )

    updated = await budget_service.update(
        budget.id, BudgetUpdate(limit=25000), user_id
    )
    assert float(updated.limit) == 25000

    await budget_service.delete(budget.id, user_id)
    with pytest.raises(NotFoundError):
        await budget_service.get(budget.id, user_id)


async def test_delete_category_cascades_related(
    category_service, transaction_service, budget_service, user_id
):
    """Удаление категории каскадно удаляет её транзакции и бюджеты."""
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    await transaction_service.create(
        TransactionCreate(
            type=FinanceType.EXPENSE, amount=100, category_id=category.id, date="2025-09-01"
        ),
        user_id,
    )
    await budget_service.create(
        BudgetCreate(category_id=category.id, limit=5000, month="2025-09"), user_id
    )

    await category_service.delete(category.id, user_id)

    assert await uow_count(transaction_service, user_id) == 0
    assert await uow_count(budget_service, user_id) == 0


async def uow_count(service, user_id: int) -> int:
    """Считает записи через list() (без привязки к деталям UoW)."""
    if hasattr(service, "list"):
        return len(await service.list(user_id, limit=500))
    raise TypeError("service без list()")


# ---------------- API ----------------


async def test_api_requires_auth(client):
    resp = await client.get(f"{PREFIX}")
    assert resp.status_code == 401


async def test_api_create_and_list_budget(client, auth_headers):
    resp = await client.post(
        "/api/v1/categories",
        json={"name": "Развлечения", "type": "expense"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    category_id = resp.json()["id"]

    resp = await client.post(
        f"{PREFIX}",
        json={"category_id": category_id, "limit": 20000, "month": "2025-09"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["category_id"] == category_id
    assert data["month"] == "2025-09"

    resp = await client.get(f"{PREFIX}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_api_duplicate_budget_conflict(client, auth_headers):
    resp = await client.post(
        "/api/v1/categories",
        json={"name": "Здоровье", "type": "expense"},
        headers=auth_headers,
    )
    category_id = resp.json()["id"]

    payload = {"category_id": category_id, "limit": 20000, "month": "2025-09"}
    resp = await client.post(f"{PREFIX}", json=payload, headers=auth_headers)
    assert resp.status_code == 201

    resp = await client.post(f"{PREFIX}", json=payload, headers=auth_headers)
    assert resp.status_code == 409


async def test_api_invalid_month(client, auth_headers):
    resp = await client.post(
        f"{PREFIX}",
        json={"category_id": 1, "limit": 1000, "month": "2025-13"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_api_not_found(client, auth_headers):
    resp = await client.get(f"{PREFIX}/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]

"""Тесты транзакций: сервис, связность с категорией, API."""

import pytest

from app.core.exceptions import NotFoundError
from app.models.enums import FinanceType
from app.schemas.category import CategoryCreate
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services.budget import BudgetService
from app.services.category import CategoryService
from app.services.transaction import TransactionService

PREFIX = "/api/v1/transactions"


@pytest.fixture
def category_service(uow) -> CategoryService:
    return CategoryService(uow)


@pytest.fixture
def transaction_service(uow) -> TransactionService:
    return TransactionService(uow)


@pytest.fixture
def budget_service(uow) -> BudgetService:
    return BudgetService(uow)


async def test_create_transaction_with_category(
    category_service, transaction_service, user_id
):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    transaction = await transaction_service.create(
        TransactionCreate(
            type=FinanceType.EXPENSE,
            amount=4500,
            category_id=category.id,
            date="2025-09-02",
            description="Продукты",
        ),
        user_id,
    )
    assert transaction.id is not None
    assert transaction.category_id == category.id
    assert transaction.user_id == user_id


async def test_create_transaction_unknown_category(transaction_service, user_id):
    with pytest.raises(NotFoundError):
        await transaction_service.create(
            TransactionCreate(
                type=FinanceType.EXPENSE, amount=100, category_id=99999, date="2025-09-02"
            ),
            user_id,
        )


async def test_create_transaction_foreign_category(
    category_service, transaction_service, user_id
):
    """Нельзя сослаться на категорию другого пользователя."""
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    with pytest.raises(NotFoundError):
        await transaction_service.create(
            TransactionCreate(
                type=FinanceType.EXPENSE,
                amount=100,
                category_id=category.id,
                date="2025-09-02",
            ),
            user_id + 1,
        )


async def test_list_transactions_filter(
    category_service, transaction_service, user_id
):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    await transaction_service.create(
        TransactionCreate(
            type=FinanceType.EXPENSE, amount=100, category_id=category.id, date="2025-09-01"
        ),
        user_id,
    )
    await transaction_service.create(
        TransactionCreate(
            type=FinanceType.INCOME, amount=5000, category_id=category.id, date="2025-09-05"
        ),
        user_id,
    )

    expenses = await transaction_service.list(user_id, type_=FinanceType.EXPENSE)
    assert len(expenses) == 1
    assert expenses[0].type == FinanceType.EXPENSE

    incomes = await transaction_service.list(user_id, type_=FinanceType.INCOME)
    assert len(incomes) == 1


async def test_transactions_of_other_user_invisible(
    category_service, transaction_service, user_id
):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    transaction = await transaction_service.create(
        TransactionCreate(
            type=FinanceType.EXPENSE, amount=100, category_id=category.id, date="2025-09-01"
        ),
        user_id,
    )
    assert await transaction_service.list(user_id + 1) == []
    with pytest.raises(NotFoundError):
        await transaction_service.get(transaction.id, user_id + 1)


async def test_update_and_delete_transaction(
    category_service, transaction_service, user_id
):
    category = await category_service.create(
        CategoryCreate(name="Еда", type=FinanceType.EXPENSE), user_id
    )
    transaction = await transaction_service.create(
        TransactionCreate(
            type=FinanceType.EXPENSE, amount=100, category_id=category.id, date="2025-09-01"
        ),
        user_id,
    )

    updated = await transaction_service.update(
        transaction.id, TransactionUpdate(amount=200, description="Обновлено"), user_id
    )
    assert float(updated.amount) == 200
    assert updated.description == "Обновлено"

    await transaction_service.delete(transaction.id, user_id)
    with pytest.raises(NotFoundError):
        await transaction_service.get(transaction.id, user_id)


# ---------------- API ----------------


async def test_api_requires_auth(client):
    resp = await client.get(f"{PREFIX}")
    assert resp.status_code == 401


async def test_api_create_and_list_transaction(client, auth_headers):
    resp = await client.post(
        "/api/v1/categories",
        json={"name": "Транспорт", "type": "expense", "icon": "🚇"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    category_id = resp.json()["id"]

    resp = await client.post(
        f"{PREFIX}",
        json={
            "type": "expense",
            "amount": 600,
            "category_id": category_id,
            "date": "2025-09-04",
            "description": "Метро",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["category_id"] == category_id

    resp = await client.get(f"{PREFIX}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_api_not_found(client, auth_headers):
    resp = await client.get(f"{PREFIX}/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]


async def test_api_invalid_category(client, auth_headers):
    resp = await client.post(
        f"{PREFIX}",
        json={
            "type": "expense",
            "amount": 100,
            "category_id": 99999,
            "date": "2025-09-01",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_api_invalid_amount(client, auth_headers):
    resp = await client.post(
        f"{PREFIX}",
        json={
            "type": "expense",
            "amount": -100,
            "category_id": 1,
            "date": "2025-09-01",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

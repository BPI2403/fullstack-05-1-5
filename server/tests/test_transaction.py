"""Тесты CRUD и API для транзакций (включая связанные категории)."""

from app.crud.category import create_category
from app.crud.exceptions import NotFoundError
from app.crud.transaction import (
    create_transaction,
    delete_transaction,
    get_transaction,
    list_transactions,
    update_transaction,
)
from app.models.base import Category
from app.schemas.category import CategoryCreate
from app.schemas.transaction import TransactionCreate, TransactionUpdate


async def _make_category(session, name="Еда", type_="expense"):
    return await create_category(
        session, CategoryCreate(name=name, type=type_, icon="🍽️", color="#ef4444")
    )


async def test_create_transaction_with_category(db_session):
    category = await _make_category(db_session)
    transaction = await create_transaction(
        db_session,
        TransactionCreate(
            type="expense",
            amount=4500,
            category_id=category.id,
            date="2025-09-02",
            description="Продукты",
        ),
    )
    assert transaction.id is not None
    assert transaction.category_id == category.id
    assert transaction.amount == 4500


async def test_create_transaction_unknown_category(db_session):
    try:
        await create_transaction(
            db_session,
            TransactionCreate(
                type="expense",
                amount=100,
                category_id=99999,
                date="2025-09-02",
            ),
        )
    except NotFoundError as exc:
        assert "Категория" in str(exc)
    else:
        raise AssertionError("Ожидалось NotFoundError")


async def test_list_transactions_filter(db_session):
    category = await _make_category(db_session)
    await create_transaction(
        db_session,
        TransactionCreate(
            type="expense", amount=100, category_id=category.id, date="2025-09-01"
        ),
    )
    await create_transaction(
        db_session,
        TransactionCreate(
            type="income", amount=5000, category_id=category.id, date="2025-09-05"
        ),
    )

    expenses = await list_transactions(db_session, type_filter="expense")
    assert len(expenses) == 1
    assert expenses[0].type == "expense"

    incomes = await list_transactions(db_session, type_filter="income")
    assert len(incomes) == 1
    assert incomes[0].type == "income"


async def test_get_and_update_transaction(db_session):
    category = await _make_category(db_session)
    transaction = await create_transaction(
        db_session,
        TransactionCreate(
            type="expense", amount=100, category_id=category.id, date="2025-09-01"
        ),
    )
    updated = await update_transaction(
        db_session,
        transaction.id,
        TransactionUpdate(amount=200, description="Обновлено"),
    )
    assert updated.amount == 200
    assert updated.description == "Обновлено"
    assert updated.type == "expense"


async def test_delete_transaction(db_session):
    category = await _make_category(db_session)
    transaction = await create_transaction(
        db_session,
        TransactionCreate(
            type="expense", amount=100, category_id=category.id, date="2025-09-01"
        ),
    )
    await delete_transaction(db_session, transaction.id)
    try:
        await get_transaction(db_session, transaction.id)
    except NotFoundError:
        pass
    else:
        raise AssertionError("Ожидалось NotFoundError после удаления")


async def test_api_create_and_list_transaction(client):
    # Сначала создаём категорию
    resp = await client.post(
        "/categories/",
        json={"name": "Транспорт", "type": "expense", "icon": "🚇", "color": "#f59e0b"},
    )
    assert resp.status_code == 201
    category_id = resp.json()["id"]

    resp = await client.post(
        "/transactions/",
        json={
            "type": "expense",
            "amount": 600,
            "category_id": category_id,
            "date": "2025-09-04",
            "description": "Метро",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["category_id"] == category_id
    assert data["amount"] == 600

    resp = await client.get("/transactions/")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1


async def test_api_transaction_not_found(client):
    resp = await client.get("/transactions/99999")
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"]


async def test_api_transaction_invalid_category(client):
    resp = await client.post(
        "/transactions/",
        json={
            "type": "expense",
            "amount": 100,
            "category_id": 99999,
            "date": "2025-09-01",
        },
    )
    assert resp.status_code == 404


async def test_api_transaction_invalid_amount(client):
    resp = await client.post(
        "/transactions/",
        json={
            "type": "expense",
            "amount": -100,
            "category_id": 1,
            "date": "2025-09-01",
        },
    )
    assert resp.status_code == 422
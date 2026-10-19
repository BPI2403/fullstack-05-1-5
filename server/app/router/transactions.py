"""Роутер транзакций."""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.transaction import (
    create_transaction,
    delete_transaction,
    get_transaction,
    list_transactions,
    update_transaction,
)
from app.crud.exceptions import NotFoundError
from app.database import get_db
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать транзакцию",
)
async def create_transaction_endpoint(
    payload: TransactionCreate,
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    try:
        transaction = await create_transaction(db, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return TransactionResponse.model_validate(transaction)


@router.get(
    "/",
    response_model=List[TransactionResponse],
    summary="Список транзакций",
)
async def list_transactions_endpoint(
    type_filter: Optional[str] = Query(
        default=None,
        description="Фильтр по типу: income или expense",
    ),
    category_id: Optional[int] = Query(
        default=None,
        description="Фильтр по id категории",
    ),
    start_date: Optional[date] = Query(
        default=None,
        description="Начальная дата (YYYY-MM-DD)",
    ),
    end_date: Optional[date] = Query(
        default=None,
        description="Конечная дата (YYYY-MM-DD)",
    ),
    db: AsyncSession = Depends(get_db),
) -> List[TransactionResponse]:
    transactions = await list_transactions(
        db,
        type_filter=type_filter,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
    )
    return [TransactionResponse.model_validate(t) for t in transactions]


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Получить транзакцию по id",
)
async def get_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    try:
        transaction = await get_transaction(db, transaction_id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return TransactionResponse.model_validate(transaction)


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Обновить транзакцию",
)
async def update_transaction_endpoint(
    transaction_id: int,
    payload: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    try:
        transaction = await update_transaction(db, transaction_id, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return TransactionResponse.model_validate(transaction)


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить транзакцию",
)
async def delete_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await delete_transaction(db, transaction_id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return None
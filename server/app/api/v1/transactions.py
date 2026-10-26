"""Маршруты API транзакций."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import TransactionServiceDep
from app.models.enums import FinanceType
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать транзакцию",
)
async def create_transaction(
    payload: TransactionCreate, service: TransactionServiceDep
) -> TransactionResponse:
    transaction = await service.create(payload)
    return TransactionResponse.model_validate(transaction)


@router.get("", response_model=list[TransactionResponse], summary="Список транзакций")
async def list_transactions(
    service: TransactionServiceDep,
    type_filter: Annotated[
        FinanceType | None,
        Query(alias="type", description="income или expense"),
    ] = None,
    category_id: Annotated[int | None, Query(description="Фильтр по id категории")] = None,
    start_date: Annotated[
        date | None, Query(description="Начало периода (YYYY-MM-DD)")
    ] = None,
    end_date: Annotated[date | None, Query(description="Конец периода (YYYY-MM-DD)")] = None,
    limit: Annotated[int, Query(ge=1, le=500, description="Размер страницы")] = 100,
    offset: Annotated[int, Query(ge=0, description="Смещение выборки")] = 0,
) -> list[TransactionResponse]:
    transactions = await service.list(
        type_=type_filter,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return [TransactionResponse.model_validate(t) for t in transactions]


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Получить транзакцию по id",
)
async def get_transaction(
    transaction_id: int, service: TransactionServiceDep
) -> TransactionResponse:
    transaction = await service.get(transaction_id)
    return TransactionResponse.model_validate(transaction)


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Обновить транзакцию",
)
async def update_transaction(
    transaction_id: int, payload: TransactionUpdate, service: TransactionServiceDep
) -> TransactionResponse:
    transaction = await service.update(transaction_id, payload)
    return TransactionResponse.model_validate(transaction)


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить транзакцию",
)
async def delete_transaction(transaction_id: int, service: TransactionServiceDep) -> None:
    await service.delete(transaction_id)

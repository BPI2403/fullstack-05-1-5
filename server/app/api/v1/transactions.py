"""Маршруты API транзакций (защищены: работают в рамках текущего пользователя)."""

from datetime import date

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUserDep, TransactionServiceDep
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
    payload: TransactionCreate, user: CurrentUserDep, service: TransactionServiceDep
) -> TransactionResponse:
    transaction = await service.create(payload, user_id=user.id)
    return TransactionResponse.model_validate(transaction)


@router.get("", response_model=list[TransactionResponse], summary="Список транзакций")
async def list_transactions(
    user: CurrentUserDep,
    service: TransactionServiceDep,
    type_: FinanceType | None = Query(default=None, alias="type"),
    category_id: int | None = Query(default=None, ge=1),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[TransactionResponse]:
    transactions = await service.list(
        user.id,
        type_=type_,
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
    transaction_id: int, user: CurrentUserDep, service: TransactionServiceDep
) -> TransactionResponse:
    transaction = await service.get(transaction_id, user_id=user.id)
    return TransactionResponse.model_validate(transaction)


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Обновить транзакцию",
)
async def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    user: CurrentUserDep,
    service: TransactionServiceDep,
) -> TransactionResponse:
    transaction = await service.update(transaction_id, payload, user_id=user.id)
    return TransactionResponse.model_validate(transaction)


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить транзакцию",
)
async def delete_transaction(
    transaction_id: int, user: CurrentUserDep, service: TransactionServiceDep
) -> None:
    await service.delete(transaction_id, user_id=user.id)

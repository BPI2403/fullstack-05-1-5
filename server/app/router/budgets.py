"""Роутер бюджетов."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.budget import (
    create_budget,
    delete_budget,
    get_budget,
    list_budgets,
    update_budget,
)
from app.crud.exceptions import DuplicateError, NotFoundError
from app.database import get_db
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post(
    "/",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать бюджет",
)
async def create_budget_endpoint(
    payload: BudgetCreate,
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    try:
        budget = await create_budget(db, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except DuplicateError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return BudgetResponse.model_validate(budget)


@router.get(
    "/",
    response_model=List[BudgetResponse],
    summary="Список бюджетов",
)
async def list_budgets_endpoint(
    month: Optional[str] = Query(
        default=None,
        description="Фильтр по месяцу (YYYY-MM)",
    ),
    category_id: Optional[int] = Query(
        default=None,
        description="Фильтр по id категории",
    ),
    db: AsyncSession = Depends(get_db),
) -> List[BudgetResponse]:
    budgets = await list_budgets(db, month=month, category_id=category_id)
    return [BudgetResponse.model_validate(b) for b in budgets]


@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Получить бюджет по id",
)
async def get_budget_endpoint(
    budget_id: int,
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    try:
        budget = await get_budget(db, budget_id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return BudgetResponse.model_validate(budget)


@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Обновить бюджет",
)
async def update_budget_endpoint(
    budget_id: int,
    payload: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    try:
        budget = await update_budget(db, budget_id, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except DuplicateError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return BudgetResponse.model_validate(budget)


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить бюджет",
)
async def delete_budget_endpoint(
    budget_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await delete_budget(db, budget_id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return None
"""Маршруты API бюджетов."""

from fastapi import APIRouter, Query, status

from app.api.deps import BudgetServiceDep
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать бюджет",
)
async def create_budget(
    payload: BudgetCreate, service: BudgetServiceDep
) -> BudgetResponse:
    budget = await service.create(payload)
    return BudgetResponse.model_validate(budget)


@router.get("", response_model=list[BudgetResponse], summary="Список бюджетов")
async def list_budgets(
    service: BudgetServiceDep,
    month: str | None = Query(default=None, description="Фильтр по месяцу (YYYY-MM)"),
    category_id: int | None = Query(default=None, description="Фильтр по id категории"),
    limit: int = Query(default=100, ge=1, le=500, description="Размер страницы"),
    offset: int = Query(default=0, ge=0, description="Смещение выборки"),
) -> list[BudgetResponse]:
    budgets = await service.list(month=month, category_id=category_id, limit=limit, offset=offset)
    return [BudgetResponse.model_validate(b) for b in budgets]


@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Получить бюджет по id",
)
async def get_budget(budget_id: int, service: BudgetServiceDep) -> BudgetResponse:
    budget = await service.get(budget_id)
    return BudgetResponse.model_validate(budget)


@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Обновить бюджет",
)
async def update_budget(
    budget_id: int, payload: BudgetUpdate, service: BudgetServiceDep
) -> BudgetResponse:
    budget = await service.update(budget_id, payload)
    return BudgetResponse.model_validate(budget)


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить бюджет",
)
async def delete_budget(budget_id: int, service: BudgetServiceDep) -> None:
    await service.delete(budget_id)

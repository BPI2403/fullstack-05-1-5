"""Маршруты API категорий."""

from fastapi import APIRouter, Query, status

from app.api.deps import CategoryServiceDep
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать категорию",
)
async def create_category(
    payload: CategoryCreate, service: CategoryServiceDep
) -> CategoryResponse:
    category = await service.create(payload)
    return CategoryResponse.model_validate(category)


@router.get("", response_model=list[CategoryResponse], summary="Список категорий")
async def list_categories(
    service: CategoryServiceDep,
    limit: int = Query(default=100, ge=1, le=500, description="Размер страницы"),
    offset: int = Query(default=0, ge=0, description="Смещение выборки"),
) -> list[CategoryResponse]:
    categories = await service.list(limit=limit, offset=offset)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Получить категорию по id",
)
async def get_category(category_id: int, service: CategoryServiceDep) -> CategoryResponse:
    category = await service.get(category_id)
    return CategoryResponse.model_validate(category)


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Обновить категорию",
)
async def update_category(
    category_id: int, payload: CategoryUpdate, service: CategoryServiceDep
) -> CategoryResponse:
    category = await service.update(category_id, payload)
    return CategoryResponse.model_validate(category)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить категорию (каскадно с транзакциями и бюджетами)",
)
async def delete_category(category_id: int, service: CategoryServiceDep) -> None:
    await service.delete(category_id)

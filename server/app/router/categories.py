"""Роутер категорий."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.category import (
    create_category,
    delete_category,
    get_category,
    list_categories,
    update_category,
)
from app.crud.exceptions import DuplicateError, NotFoundError
from app.database import get_db
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать категорию",
)
async def create_category_endpoint(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    try:
        category = await create_category(db, payload)
    except DuplicateError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return CategoryResponse.model_validate(category)


@router.get("/", response_model=List[CategoryResponse], summary="Список категорий")
async def list_categories_endpoint(
    db: AsyncSession = Depends(get_db),
) -> List[CategoryResponse]:
    categories = await list_categories(db)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Получить категорию по id",
)
async def get_category_endpoint(
    category_id: int,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    try:
        category = await get_category(db, category_id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return CategoryResponse.model_validate(category)


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Обновить категорию",
)
async def update_category_endpoint(
    category_id: int,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    try:
        category = await update_category(db, category_id, payload)
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
    return CategoryResponse.model_validate(category)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить категорию",
)
async def delete_category_endpoint(
    category_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await delete_category(db, category_id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return None
"""Схемы категорий (запросы и ответы API)."""

from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Зарплата", "Еда"])
    type: str = Field(..., min_length=1, max_length=20, examples=["income", "expense"])
    icon: Optional[str] = Field(default=None, max_length=50, examples=["💼", "🍽️"])
    color: Optional[str] = Field(default=None, max_length=20, examples=["#2563eb", "#ef4444"])


class CategoryCreate(CategoryBase):
    """Создание категории."""


class CategoryUpdate(BaseModel):
    """Обновление категории (все поля опциональны)."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[str] = Field(default=None, min_length=1, max_length=20)
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)


class CategoryResponse(CategoryBase):
    """Ответ с данными категории."""

    id: int

    model_config = ConfigDict(from_attributes=True)
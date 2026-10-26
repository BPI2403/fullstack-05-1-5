"""Схемы категорий (запросы и ответы API)."""

from pydantic import Field

from app.models.enums import FinanceType
from app.schemas.base import BaseSchema


class CategoryCreate(BaseSchema):
    """Данные для создания категории."""

    name: str = Field(min_length=1, max_length=100, examples=["Зарплата"])
    type: FinanceType = Field(examples=[FinanceType.INCOME])
    icon: str | None = Field(default=None, max_length=50, examples=["💼"])
    color: str | None = Field(default=None, max_length=20, examples=["#2563eb"])


class CategoryUpdate(BaseSchema):
    """Данные для частичного обновления категории (все поля опциональны)."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: FinanceType | None = None
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class CategoryResponse(BaseSchema):
    """Категория в ответе API."""

    id: int
    name: str
    type: FinanceType
    icon: str | None
    color: str | None

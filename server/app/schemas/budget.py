"""Схемы бюджетов (запросы и ответы API)."""

from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class BudgetBase(BaseModel):
    category_id: int = Field(..., examples=[1])
    limit: float = Field(..., gt=0, examples=[20000])
    month: str = Field(..., min_length=7, max_length=7, pattern=r"^\d{4}-\d{2}$", examples=["2025-09"])


class BudgetCreate(BudgetBase):
    """Создание бюджета."""


class BudgetUpdate(BaseModel):
    """Обновление бюджета (все поля опциональны)."""

    category_id: Optional[int] = Field(default=None)
    limit: Optional[float] = Field(default=None, gt=0)
    month: Optional[str] = Field(default=None, min_length=7, max_length=7, pattern=r"^\d{4}-\d{2}$")


class BudgetResponse(BudgetBase):
    """Ответ с данными бюджета."""

    id: int

    model_config = ConfigDict(from_attributes=True)
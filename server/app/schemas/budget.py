"""Схемы бюджетов (запросы и ответы API)."""

from pydantic import Field

from app.schemas.base import BaseSchema

# Месяц строго в формате YYYY-MM с реальным номером месяца 01-12.
MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


class BudgetCreate(BaseSchema):
    """Данные для создания бюджета."""

    category_id: int = Field(gt=0, examples=[1])
    limit: float = Field(gt=0, examples=[20000])
    month: str = Field(pattern=MONTH_PATTERN, examples=["2025-09"])


class BudgetUpdate(BaseSchema):
    """Данные для частичного обновления бюджета (все поля опциональны)."""

    category_id: int | None = Field(default=None, gt=0)
    limit: float | None = Field(default=None, gt=0)
    month: str | None = Field(default=None, pattern=MONTH_PATTERN)


class BudgetResponse(BaseSchema):
    """Бюджет в ответе API."""

    id: int
    category_id: int
    limit: float
    month: str

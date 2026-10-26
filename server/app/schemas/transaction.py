"""Схемы транзакций (запросы и ответы API)."""

import datetime

from pydantic import Field

from app.models.enums import FinanceType
from app.schemas.base import BaseSchema


# Аннотация ``datetime.date`` вместо ``date``: имя поля ``date`` не должно
# совпадать с именем типа (конфликт резолвинга аннотаций Pydantic).
class TransactionCreate(BaseSchema):
    """Данные для создания транзакции."""

    type: FinanceType = Field(examples=[FinanceType.EXPENSE])
    amount: float = Field(gt=0, examples=[4500])
    category_id: int = Field(gt=0, examples=[1])
    date: datetime.date = Field(examples=["2025-09-02"])
    description: str | None = Field(default=None, max_length=255, examples=["Продукты"])


class TransactionUpdate(BaseSchema):
    """Данные для частичного обновления транзакции (все поля опциональны)."""

    type: FinanceType | None = None
    amount: float | None = Field(default=None, gt=0)
    category_id: int | None = Field(default=None, gt=0)
    date: datetime.date | None = Field(default=None)
    description: str | None = Field(default=None, max_length=255)


class TransactionResponse(BaseSchema):
    """Транзакция в ответе API."""

    id: int
    type: FinanceType
    amount: float
    category_id: int
    date: datetime.date
    description: str | None


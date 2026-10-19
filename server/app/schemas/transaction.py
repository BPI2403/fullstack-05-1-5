"""Схемы транзакций (запросы и ответы API)."""

from datetime import date
from typing import Annotated, Optional

from pydantic import BaseModel, Field, ConfigDict


class TransactionBase(BaseModel):
    type: str = Field(..., min_length=1, max_length=20, examples=["income", "expense"])
    amount: float = Field(..., gt=0, examples=[120000, 4500])
    category_id: int = Field(..., examples=[1])
    date: Annotated[date, Field(..., examples=["2025-09-02"])]
    description: Optional[str] = Field(default=None, max_length=255, examples=["Продукты"])


class TransactionCreate(TransactionBase):
    """Создание транзакции."""


class TransactionUpdate(BaseModel):
    """Обновление транзакции (все поля опциональны)."""

    type: Optional[str] = Field(default=None, min_length=1, max_length=20)
    amount: Optional[float] = Field(default=None, gt=0)
    category_id: Optional[int] = Field(default=None)
    date: Annotated[Optional[date], Field(default=None)]
    description: Optional[str] = Field(default=None, max_length=255)


class TransactionResponse(TransactionBase):
    """Ответ с данными транзакции."""

    id: int

    model_config = ConfigDict(from_attributes=True)
"""Доменные перечисления приложения."""

from enum import Enum, StrEnum


class FinanceType(StrEnum):
    """Тип движения денежных средств."""

    INCOME = "income"
    EXPENSE = "expense"


def enum_values(enum_cls: type[Enum]) -> list[str]:
    """Значения перечисления для колонки БД (VARCHAR + CHECK)."""
    return [member.value for member in enum_cls]

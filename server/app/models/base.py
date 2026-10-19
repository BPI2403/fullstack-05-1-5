"""Основные сущности проекта: категории, транзакции, бюджеты.

Связи:
- ``Category`` 1:N ``Transaction`` (одна категория — многие транзакции)
- ``Category`` 1:N ``Budget`` (одна категория — много бюджетов по разным месяцам)

Первичные ключи — ``id`` (int, autoincrement).
Внешние ключи:
- ``Transaction.category_id -> Category.id`` (ON DELETE CASCADE)
- ``Budget.category_id -> Category.id`` (ON DELETE CASCADE)
"""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    """Категория доходов/расходов."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # "income" | "expense"
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Связи
    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )
    budgets: Mapped[List["Budget"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Category(id={self.id}, name={self.name!r}, type={self.type!r})>"


class Transaction(Base):
    """Финансовая транзакция (доход или расход)."""

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # "income" | "expense"
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[date] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Связь
    category: Mapped["Category"] = relationship(back_populates="transactions")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Transaction(id={self.id}, type={self.type!r}, amount={self.amount})>"


class Budget(Base):
    """Месячный бюджет (лимит трат) для категории."""

    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    limit: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # "YYYY-MM"

    # Связь
    category: Mapped["Category"] = relationship(back_populates="budgets")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Budget(id={self.id}, category_id={self.category_id}, month={self.month!r})>"
"""Модель финансовой транзакции."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy import Enum as SaEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IntPrimaryKeyMixin, TimestampMixin
from app.models.category import Category
from app.models.enums import FinanceType, enum_values


class Transaction(IntPrimaryKeyMixin, TimestampMixin, Base):
    """Финансовая транзакция (доход или расход)."""

    __tablename__ = "transactions"

    type: Mapped[FinanceType] = mapped_column(
        SaEnum(FinanceType, native_enum=False, length=20, values_callable=enum_values),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(255))

    category: Mapped[Category] = relationship(back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction id={self.id} type={self.type} amount={self.amount}>"

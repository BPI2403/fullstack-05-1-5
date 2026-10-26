"""Модель месячного бюджета (лимита трат) для категории."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IntPrimaryKeyMixin, TimestampMixin
from app.models.category import Category


class Budget(IntPrimaryKeyMixin, TimestampMixin, Base):
    """Месячный лимит трат по категории (месяц — строка ``YYYY-MM``)."""

    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("category_id", "month"),)

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)

    category: Mapped[Category] = relationship(back_populates="budgets")

    def __repr__(self) -> str:
        return f"<Budget id={self.id} category_id={self.category_id} month={self.month!r}>"

"""Модель категории доходов/расходов."""

from typing import TYPE_CHECKING

from sqlalchemy import Enum as SaEnum
from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IntPrimaryKeyMixin, TimestampMixin
from app.models.enums import FinanceType, enum_values

if TYPE_CHECKING:
    from app.models.budget import Budget
    from app.models.transaction import Transaction


class Category(IntPrimaryKeyMixin, TimestampMixin, Base):
    """Категория доходов/расходов."""

    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("name", "type"),)

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    type: Mapped[FinanceType] = mapped_column(
        SaEnum(FinanceType, native_enum=False, length=20, values_callable=enum_values),
        nullable=False,
        index=True,
    )
    icon: Mapped[str | None] = mapped_column(String(50))
    color: Mapped[str | None] = mapped_column(String(20))

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r} type={self.type}>"

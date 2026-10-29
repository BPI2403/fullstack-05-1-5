"""Модель пользователя приложения."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IntPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import Category


class User(IntPrimaryKeyMixin, TimestampMixin, Base):
    """Зарегистрированный пользователь."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    # Хеш пароля (bcrypt); сырой пароль никогда не сохраняется.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    categories: Mapped[list["Category"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"

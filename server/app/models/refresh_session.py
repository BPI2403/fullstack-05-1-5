"""Модель refresh-сессии для обновления access token."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IntPrimaryKeyMixin


class RefreshSession(IntPrimaryKeyMixin, Base):
    """Сессия обновления токенов.

    В БД хранится только SHA-256 хеш refresh token, поэтому утечка базы
    не раскрывает сами токены. Отзыв сессии (``revoked_at``) запрещает
    дальнейшее обновление access token.
    """

    __tablename__ = "refresh_sessions"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # SHA-256 хеш значения refresh token (hex, 64 символа).
    token_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        revoked = self.revoked_at is not None
        return f"<RefreshSession id={self.id} user_id={self.user_id} revoked={revoked}>"

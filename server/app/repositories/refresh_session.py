"""Репозиторий refresh-сессий."""

from datetime import UTC, datetime

from sqlalchemy import select, update

from app.models.refresh_session import RefreshSession
from app.repositories.base import BaseRepository


class RefreshSessionRepository(BaseRepository[RefreshSession]):
    """Доступ к таблице ``refresh_sessions``."""

    model = RefreshSession

    async def get_by_token_hash(self, token_hash: str) -> RefreshSession | None:
        """Ищет активную (не отозванную и не истёкшую) сессию по хешу токена."""
        stmt = select(RefreshSession).where(
            RefreshSession.token_hash == token_hash,
            RefreshSession.revoked_at.is_(None),
            RefreshSession.expires_at > datetime.now(UTC),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke(self, token_hash: str) -> None:
        """Отзывает сессию по хешу токена (идемпотентно)."""
        stmt = (
            update(RefreshSession)
            .where(
                RefreshSession.token_hash == token_hash,
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)

    async def revoke_all_for_user(self, user_id: int) -> None:
        """Отзывает все активные сессии пользователя (например, при смене пароля)."""
        stmt = (
            update(RefreshSession)
            .where(
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)

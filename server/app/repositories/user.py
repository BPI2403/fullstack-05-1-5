"""Репозиторий пользователей."""

from sqlalchemy import select

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Доступ к таблице ``users``."""

    model = User

    async def get_by_email(self, email: str) -> User | None:
        """Ищет пользователя по email (без учёта регистра)."""
        stmt = select(User).where(User.email == email.lower())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

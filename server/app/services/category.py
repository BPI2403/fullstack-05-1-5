"""Сервис категорий: бизнес-логика поверх репозитория (в рамках пользователя)."""

from collections.abc import Sequence

from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictError, NotFoundError
from app.db.unit_of_work import UnitOfWork
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    """Бизнес-операции с категориями пользователя."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def create(self, payload: CategoryCreate, user_id: int) -> Category:
        """Создаёт категорию; дубликат (name, type) у пользователя отклоняется."""
        duplicate = await self._uow.categories.get_by_name_and_type(
            payload.name, payload.type, user_id
        )
        if duplicate is not None:
            raise ConflictError(
                f"Категория «{payload.name}» с типом {payload.type.value} уже существует"
            )

        category = Category(
            user_id=user_id,
            name=payload.name,
            type=payload.type,
            icon=payload.icon,
            color=payload.color,
        )
        self._uow.categories.add(category)
        await self._commit_or_conflict(category)
        return category

    async def get(self, category_id: int, user_id: int) -> Category:
        """Возвращает категорию пользователя или выбрасывает ``NotFoundError``.

        Чужая категория неотличима от несуществующей (тот же 404):
        API не раскрывает наличие чужих данных.
        """
        category = await self._uow.categories.get_for_user(category_id, user_id)
        if category is None:
            raise NotFoundError("Категория", category_id)
        return category

    async def list(
        self, user_id: int, *, limit: int = 100, offset: int = 0
    ) -> Sequence[Category]:
        """Список категорий пользователя с пагинацией."""
        return await self._uow.categories.list_for_user(user_id, limit=limit, offset=offset)

    async def update(self, category_id: int, payload: CategoryUpdate, user_id: int) -> Category:
        """Частично обновляет категорию пользователя."""
        category = await self.get(category_id, user_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await self._commit_or_conflict(category)
        return category

    async def delete(self, category_id: int, user_id: int) -> None:
        """Удаляет категорию; связанные транзакции и бюджеты — каскадно."""
        category = await self.get(category_id, user_id)
        await self._uow.categories.delete(category)
        await self._uow.commit()

    async def _commit_or_conflict(self, category: Category) -> None:
        """Коммитит изменения; гонку уникальности в БД переводит в ConflictError."""
        try:
            await self._uow.commit()
        except IntegrityError as exc:
            await self._uow.rollback()
            raise ConflictError("Категория с такими параметрами уже существует") from exc
        await self._uow.session.refresh(category)

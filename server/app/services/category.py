"""Сервис категорий: бизнес-логика поверх репозитория."""

from collections.abc import Sequence

from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictError, NotFoundError
from app.db.unit_of_work import UnitOfWork
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    """Бизнес-операции с категориями."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def create(self, payload: CategoryCreate) -> Category:
        """Создаёт категорию; дубликат (name, type) отклоняется."""
        duplicate = await self._uow.categories.get_by_name_and_type(
            payload.name, payload.type
        )
        if duplicate is not None:
            raise ConflictError(
                f"Категория «{payload.name}» с типом {payload.type.value} уже существует"
            )

        category = Category(
            name=payload.name,
            type=payload.type,
            icon=payload.icon,
            color=payload.color,
        )
        self._uow.categories.add(category)
        await self._commit_or_conflict(category)
        return category

    async def get(self, category_id: int) -> Category:
        """Возвращает категорию или выбрасывает ``NotFoundError``."""
        category = await self._uow.categories.get(category_id)
        if category is None:
            raise NotFoundError("Категория", category_id)
        return category

    async def list(self, *, limit: int = 100, offset: int = 0) -> Sequence[Category]:
        """Список категорий с пагинацией."""
        return await self._uow.categories.list(limit=limit, offset=offset)

    async def update(self, category_id: int, payload: CategoryUpdate) -> Category:
        """Частично обновляет категорию."""
        category = await self.get(category_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await self._commit_or_conflict(category)
        return category

    async def delete(self, category_id: int) -> None:
        """Удаляет категорию; связанные транзакции и бюджеты — каскадно."""
        category = await self.get(category_id)
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

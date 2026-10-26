"""Сервис бюджетов: бизнес-логика поверх репозитория."""

from collections.abc import Sequence

from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictError, NotFoundError
from app.db.unit_of_work import UnitOfWork
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate


class BudgetService:
    """Бизнес-операции с бюджетами."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def create(self, payload: BudgetCreate) -> Budget:
        """Создаёт бюджет; на категорию и месяц — не более одного бюджета."""
        if await self._uow.categories.get(payload.category_id) is None:
            raise NotFoundError("Категория", payload.category_id)

        existing = await self._uow.budgets.get_by_category_and_month(
            payload.category_id, payload.month
        )
        if existing is not None:
            raise ConflictError(
                f"Бюджет для категории {payload.category_id} "
                f"на месяц {payload.month} уже существует"
            )

        budget = Budget(
            category_id=payload.category_id,
            limit=payload.limit,
            month=payload.month,
        )
        self._uow.budgets.add(budget)
        await self._commit_or_conflict(budget, payload.category_id, payload.month)
        return budget

    async def get(self, budget_id: int) -> Budget:
        """Возвращает бюджет или выбрасывает ``NotFoundError``."""
        budget = await self._uow.budgets.get(budget_id)
        if budget is None:
            raise NotFoundError("Бюджет", budget_id)
        return budget

    async def list(
        self,
        *,
        month: str | None = None,
        category_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Budget]:
        """Список бюджетов с фильтрами и пагинацией."""
        return await self._uow.budgets.list_filtered(
            month=month,
            category_id=category_id,
            limit=limit,
            offset=offset,
        )

    async def update(self, budget_id: int, payload: BudgetUpdate) -> Budget:
        """Частично обновляет бюджет."""
        budget = await self.get(budget_id)
        update_data = payload.model_dump(exclude_unset=True)

        new_category_id = update_data.pop("category_id", None)
        if new_category_id is not None:
            if await self._uow.categories.get(new_category_id) is None:
                raise NotFoundError("Категория", new_category_id)
            budget.category_id = new_category_id

        for field, value in update_data.items():
            setattr(budget, field, value)

        await self._commit_or_conflict(budget, budget.category_id, budget.month)
        return budget

    async def delete(self, budget_id: int) -> None:
        """Удаляет бюджет."""
        budget = await self.get(budget_id)
        await self._uow.budgets.delete(budget)
        await self._uow.commit()

    async def _commit_or_conflict(
        self, budget: Budget, category_id: int, month: str
    ) -> None:
        """Коммитит изменения; гонку уникальности в БД переводит в ConflictError."""
        try:
            await self._uow.commit()
        except IntegrityError as exc:
            await self._uow.rollback()
            raise ConflictError(
                f"Бюджет для категории {category_id} на месяц {month} уже существует"
            ) from exc
        await self._uow.session.refresh(budget)

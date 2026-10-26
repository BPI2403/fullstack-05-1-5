"""Доменные исключения приложения.

Их бросает слой сервисов; в HTTP-ответы они превращаются централизованно
в ``app.core.exception_handlers``, поэтому роутеры не содержат try/except.
"""


class DomainError(Exception):
    """Базовый класс доменных ошибок."""


class NotFoundError(DomainError):
    """Запись не найдена (HTTP 404)."""

    def __init__(self, entity: str, entity_id: object) -> None:
        self.entity = entity
        self.entity_id = entity_id
        super().__init__(f"{entity} с идентификатором {entity_id} не найден")


class ConflictError(DomainError):
    """Конфликт уникальности или состояния (HTTP 409)."""


class DomainValidationError(DomainError):
    """Нарушение бизнес-правил (HTTP 400)."""

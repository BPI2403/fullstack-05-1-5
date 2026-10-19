"""Исключения бизнес-логики."""

class NotFoundError(Exception):
    """Запись не найдена в базе данных."""

    def __init__(self, entity: str, identifier) -> None:
        self.entity = entity
        self.identifier = identifier
        super().__init__(f"{entity} с идентификатором {identifier!r} не найден")


class DuplicateError(Exception):
    """Конфликт уникального ограничения (дубликат)."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class ValidationError(Exception):
    """Ошибка валидации бизнес-правил."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)
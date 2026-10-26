"""Базовые настройки Pydantic-схем."""

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Базовая схема API: чтение из ORM-объектов, обрезка пробелов."""

    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

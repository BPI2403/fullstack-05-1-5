"""Настройка логирования приложения."""

import logging
import sys

from app.core.config import settings

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"


def configure_logging() -> None:
    """Настраивает root-логгер: единый формат, вывод в stdout."""
    logging.basicConfig(
        level=settings.log_level.upper(),
        format=LOG_FORMAT,
        stream=sys.stdout,
        force=True,
    )

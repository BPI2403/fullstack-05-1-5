# syntax=docker/dockerfile:1

# ---------- Stage 1: сборка зависимостей ----------
FROM python:3.12-slim AS builder

WORKDIR /app

# uv — быстрый менеджер пакетов/окружений
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Сначала только манифесты зависимостей — слой кэшируется
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# ---------- Stage 2: runtime ----------
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Готовое виртуальное окружение из stage 1 (без компиляторов и кэшей)
COPY --from=builder /app/.venv /app/.venv

# Код приложения и миграции
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./

EXPOSE 8000

# При старте контейнера сначала применяются миграции, затем запускается API.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

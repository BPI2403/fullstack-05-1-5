# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# Устанавливаем системные зависимости для сборки asyncpg и прочих пакетов
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Копируем файлы зависимостей и создаём виртуальное окружение
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-cache

# Копируем исходный код приложения
COPY app ./app

# Открываем порт приложения
EXPOSE 8000

# Запускаем приложение через uvicorn
ENV PATH="/app/.venv/bin:$PATH"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# Backend — Личный финучёт API

Backend-приложение на **FastAPI** + **SQLAlchemy 2 (async)** + **PostgreSQL** для личного учёта финансов: доходы/расходы, категории и бюджеты.

Архитектура — слоистая (layered), production-ready:

```
Presentation (app/api)   →  Service (app/services)  →  Repository (app/repositories)  →  Models (app/models)
        HTTP, DI, схемы          бизнес-правила, UoW          запросы к БД                    таблицы SQLAlchemy
```

## Структура проекта

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Фабрика приложения (composition root): CORS, роутеры, lifespan
│   ├── api/                     # Слой представления (Presentation)
│   │   ├── deps.py              # DI: Unit of Work и сервисы через Depends
│   │   ├── health.py            # Health-check пробы (/health/live, /health/ready)
│   │   └── v1/
│   │       ├── router.py        # Агрегатор маршрутов API v1
│   │       ├── categories.py    # Маршруты категорий
│   │       ├── transactions.py  # Маршруты транзакций
│   │       └── budgets.py       # Маршруты бюджетов
│   ├── services/                # Слой бизнес-логики (Service)
│   │   ├── category.py          # Правила категорий (уникальность и т.д.)
│   │   ├── transaction.py       # Правила транзакций (проверка FK и т.д.)
│   │   └── budget.py            # Правила бюджетов (1 бюджет на категорию+месяц)
│   ├── repositories/            # Слой доступа к данным (Repository)
│   │   ├── base.py              # Generic-репозиторий (get/list/add/delete)
│   │   ├── category.py
│   │   ├── transaction.py
│   │   └── budget.py
│   ├── db/                      # Инфраструктура БД
│   │   ├── base.py              # DeclarativeBase + конвенция имён ограничений
│   │   ├── session.py           # Асинхронный движок и фабрика сессий
│   │   └── unit_of_work.py      # Unit of Work: единая транзакция на операцию
│   ├── models/                  # Модели SQLAlchemy
│   │   ├── base.py              # Примеси: первичный ключ, timestamps
│   │   ├── enums.py             # FinanceType (income | expense)
│   │   ├── category.py
│   │   ├── transaction.py
│   │   └── budget.py
│   ├── schemas/                 # Схемы Pydantic (валидация запросов/ответов)
│   │   ├── base.py
│   │   ├── category.py
│   │   ├── transaction.py
│   │   └── budget.py
│   └── core/                    # Сквозные механизмы
│       ├── config.py            # Конфигурация (pydantic-settings, .env)
│       ├── exceptions.py        # Доменные исключения (404/409/400)
│       ├── exception_handlers.py# Централизованный маппинг исключений → HTTP
│       └── logging.py           # Настройка логирования
├── migrations/                  # Alembic-миграции
│   ├── env.py                   # Асинхронное окружение, URL из настроек приложения
│   └── versions/                # Версии схемы (initial schema и далее)
├── tests/                       # Pytest: сервисы + API на in-memory SQLite
│   ├── conftest.py              # Фикстуры: БД, Unit of Work, HTTP-клиент
│   ├── test_category.py
│   ├── test_transaction.py
│   └── test_budget.py
├── alembic.ini                  # Конфигурация Alembic (URL берётся из .env)
├── Dockerfile                   # Multi-stage сборка (uv + python:3.12-slim)
├── compose.yml                  # Docker Compose: app + PostgreSQL 16
├── .env.example                 # Пример настроек без секретов
├── pyproject.toml               # Зависимости и инструменты (uv, ruff, pytest)
└── uv.lock                      # Зафиксированные версии зависимостей
```

## Модель данных

Три связанные таблицы с первичными и внешними ключами:

| Таблица | Первичный ключ | Внешние ключи | Описание |
|---------|---------------|---------------|----------|
| `categories` | `id` (int, PK) | — | Категория дохода/расхода (name, type, icon, color); уникальна пара (name, type) |
| `transactions` | `id` (int, PK) | `category_id → categories.id` (ON DELETE CASCADE) | Транзакция (type, amount, date, description) |
| `budgets` | `id` (int, PK) | `category_id → categories.id` (ON DELETE CASCADE) | Месячный лимит (limit, month `YYYY-MM`); уникальна пара (category_id, month) |

Связи:
- **Category 1:N Transaction** — у категории много транзакций.
- **Category 1:N Budget** — у категории бюджеты на разные месяцы.
- Удаление категории **каскадно** удаляет её транзакции и бюджеты (ORM `cascade="all, delete-orphan"` + `ON DELETE CASCADE` в БД).

Типы (`income`/`expense`) хранятся как VARCHAR с CHECK-ограничением через `Enum(FinanceType)` — значения валидируются и на уровне API (Pydantic), и на уровне БД.

## API endpoints

Базовый префикс: **`/api/v1`**. Интерактивная документация: `/docs` (Swagger UI), схема: `/openapi.json`.

### Категории — `/api/v1/categories`
- `POST /api/v1/categories` — создать (`201 Created`; `409` если пара name+type уже есть)
- `GET /api/v1/categories` — список (`200`, пагинация `limit`/`offset`)
- `GET /api/v1/categories/{id}` — по id (`200`; `404` если не найдено)
- `PATCH /api/v1/categories/{id}` — частично обновить (`200`; `404` / `409`)
- `DELETE /api/v1/categories/{id}` — удалить каскадно с транзакциями и бюджетами (`204`; `404`)

### Транзакции — `/api/v1/transactions`
- `POST /api/v1/transactions` — создать (`201`; `404` если категория не существует)
- `GET /api/v1/transactions` — список с фильтрами `type`, `category_id`, `start_date`, `end_date` + пагинация (`200`)
- `GET /api/v1/transactions/{id}` — по id (`200`; `404`)
- `PATCH /api/v1/transactions/{id}` — обновить (`200`; `404`)
- `DELETE /api/v1/transactions/{id}` — удалить (`204`; `404`)

### Бюджеты — `/api/v1/budgets`
- `POST /api/v1/budgets` — создать (`201`; `404` если категории нет; `409` если бюджет на эту категорию и месяц уже есть)
- `GET /api/v1/budgets` — список с фильтрами `month`, `category_id` + пагинация (`200`)
- `GET /api/v1/budgets/{id}` — по id (`200`; `404`)
- `PATCH /api/v1/budgets/{id}` — обновить (`200`; `404` / `409`)
- `DELETE /api/v1/budgets/{id}` — удалить (`204`; `404`)

### Служебные
- `GET /` — информация о сервисе
- `GET /health/live` — liveness-проба (процесс жив)
- `GET /health/ready` — readiness-проба (БД доступна; `503` если нет)

### Коды ошибок
- `404 Not Found` — запись не найдена, понятный `detail` («Категория с идентификатором 999 не найден»)
- `409 Conflict` — конфликт уникальности (дубликат категории/бюджета)
- `422 Unprocessable Entity` — некорректные данные (Pydantic: отрицательная сумма, неверный enum, месяц не `YYYY-MM` и т.п.)

Доменные исключения обрабатываются **централизованно** (`app/core/exception_handlers.py`) — роутеры не содержат `try/except`.

## Порядок настройки и запуска

### Предварительные требования
- [uv](https://github.com/astral-sh/uv) — менеджер пакетов Python
- Python 3.12+
- PostgreSQL 16 (или Docker Compose)

### 1. Настройка окружения

```bash
cd server
cp .env.example .env
# отредактируйте .env — задайте реальные DATABASE_URL и другие параметры
```

`.env` не коммитится (в `.gitignore`); пример без секретов — `.env.example`.

### 2. Установка зависимостей

```bash
uv sync
```

### 3. Подготовка БД и создание таблиц

Вариант A — **миграции Alembic** (рекомендуется):

```bash
uv run alembic upgrade head                    # применить все миграции
uv run alembic revision --autogenerate -m "..."  # создать новую миграцию по моделям
uv run alembic downgrade -1                    # откатить последнюю
```

Вариант B — автосоздание при старте (для dev/демо): `DB_AUTO_CREATE=True` (по умолчанию) — таблицы создаются в `lifespan` приложения.

### 4. Запуск

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: `http://localhost:8000` (Swagger UI: `/docs`). Альтернативно: `make backend-dev` из корня репозитория.

### 5. Запуск через Docker Compose (PostgreSQL + приложение)

```bash
docker compose up --build
```

Поднимаются два сервиса:
- `db` — PostgreSQL 16 (порт 5432, данные в named volume `finance_db_data`, healthcheck `pg_isready`)
- `app` — FastAPI backend (порт 8000): при старте применяет `alembic upgrade head`, затем запускает uvicorn

Остановить: `docker compose down`; сбросить данные: `docker compose down -v`.

## Тесты

Тесты используют in-memory SQLite и проверяют **ту же архитектуру**, что и production: сервисы работают через реальный Unit of Work, API — через подменённую зависимость `get_uow`. Покрыты: CRUD всех сущностей, бизнес-правила (дубликаты, проверка FK), фильтры, каскадное удаление связанных записей, коды ошибок 404/409/422.

```bash
uv run pytest          # 26 тестов
uv run ruff check app tests migrations   # линтер
```

## Переменные окружения (.env)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `APP_NAME` | Название API | `Личный финучёт API` |
| `APP_VERSION` | Версия API | `0.1.0` |
| `DEBUG` | Режим отладки (SQL-эхо) | `False` |
| `LOG_LEVEL` | Уровень логирования | `INFO` |
| `API_V1_PREFIX` | Префикс маршрутов API | `/api/v1` |
| `DATABASE_URL` | URL PostgreSQL (asyncpg) | `postgresql+asyncpg://postgres:postgres@localhost:5432/finance` |
| `DB_AUTO_CREATE` | Автосоздание таблиц при старте (dev) | `True` |
| `ALLOWED_ORIGINS` | Разрешённые источники CORS через запятую | `http://localhost:3000,...` |

Пример без секретов: `.env.example`.

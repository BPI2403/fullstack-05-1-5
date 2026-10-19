# Backend — Личный финучёт API

Backend-приложение на **FastAPI** + **SQLAlchemy** (async) + **PostgreSQL** для личного учёта финансов: доходы/расходы, категории и бюджеты.

## Структура проекта (разделение по назначению)

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py              # Фабрика приложения, CORS, роутеры, lifespan
│   ├── config.py            # Конфигурация (pydantic-settings, переменные окружения)
│   ├── database.py          # Движок, сессии SQLAlchemy, база declarative
│   ├── models/
│   │   ├── __init__.py
│   │   └── base.py          # SQLAlchemy ORM-модели (Category, Transaction, Budget)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── category.py      # Pydantic-схемы категории (запрос/ответ)
│   │   ├── transaction.py   # Pydantic-схемы транзакции
│   │   └── budget.py        # Pydantic-схемы бюджета
│   ├── crud/
│   │   ├── __init__.py
│   │   ├── exceptions.py    # Исключения бизнес-логики (NotFoundError, DuplicateError)
│   │   ├── category.py      # CRUD категории
│   │   ├── transaction.py   # CRUD транзакций
│   │   └── budget.py        # CRUD бюджетов
│   └── router/
│       ├── __init__.py
│       ├── categories.py    # API-маршруты категорий
│       ├── transactions.py  # API-маршруты транзакций
│       └── budgets.py       # API-маршруты бюджетов
├── tests/
│   ├── conftest.py          # Фикстуры БД (in-memory SQLite) и HTTP-клиента
│   ├── test_category.py
│   ├── test_transaction.py
│   └── test_budget.py
├── Dockerfile               # Сборка приложения (uv + python:3.12-slim)
├── compose.yml              # Docker Compose: app + PostgreSQL
├── .env.example             # Пример настроек без секретов
├── .python-version
├── pyproject.toml           # Зависимости и метаданные проекта (uv)
├── uv.lock                  # Зафиксированные версии зависимостей
└── README.md
```

### 1.1 Маршруты API → `app/router/*.py`
### 1.2 Модели SQLAlchemy и схемы валидации → `app/models/*.py`, `app/schemas/*.py`
### 1.3 Подключение и сессии БД, операции с данными и бизнес-логика → `app/database.py`, `app/crud/*.py`
### 1.3 Конфигурация приложения → `app/config.py`

## Модель данных

Определены три связанные таблицы с первичными и внешними ключами:

| Таблица | Первичный ключ | Внешние ключи | Описание |
|---------|---------------|---------------|----------|
| `categories` | `id` (int, PK) | — | Категория дохода/расхода (имя, тип, иконка, цвет) |
| `transactions` | `id` (int, PK) | `category_id → categories.id` (ON DELETE CASCADE) | Транзакция (тип, сумма, дата, описание) |
| `budgets` | `id` (int, PK) | `category_id → categories.id` (ON DELETE CASCADE) | Месячный бюджет/лимит (category_id, limit, месяц `YYYY-MM`) |

Связи:
- Категория 1:N Транзакции (при удалении категории каскадно удаляются её транзакции и бюджеты)
- Категория 1:N Бюджеты (по разным месяцам)

## API endpoints

### Категории — `/categories`
- `POST /categories` — создать категорию (`201 Created`)
- `GET /categories` — список категорий (`200 OK`)
- `GET /categories/{id}` — получить по id (`200`, `404` если не найдено)
- `PATCH /categories/{id}` — обновить (`200`, `404` / `400` при конфликте)
- `DELETE /categories/{id}` — удалить (`204 No Content`, `404` если не найдено)

### Транзакции — `/transactions`
- `POST /transactions` — создать (`201`, `404` если категория не существует)
- `GET /transactions` — список с фильтрами `type`, `category_id`, `start_date`, `end_date` (`200`)
- `GET /transactions/{id}` — по id (`200`, `404`)
- `PATCH /transactions/{id}` — обновить (`200`, `404`)
- `DELETE /transactions/{id}` — удалить (`204`, `404`)

### Бюджеты — `/budgets`
- `POST /budgets` — создать (`201`, `404` если категория не существует, `400` если бюджет на эту категорию и месяц уже есть)
- `GET /budgets` — список с фильтрами `month`, `category_id` (`200`)
- `GET /budgets/{id}` — по id (`200`, `404`)
- `PATCH /budgets/{id}` — обновить (`200`, `404` / `400` при конфликте)
- `DELETE /budgets/{id}` — удалить (`204`, `404`)

Ошибки валидации некорректных данных возвращают `422 Unprocessable Entity` (Pydantic). Отсутствующие записи — `404 Not Found` с понятным `detail`. Конфликты уникальности — `400 Bad Request`.

Документация интерактивная: `GET /docs` (Swagger UI) и `GET /openapi.json`.

## Порядок настройки и запуска

### Предварительные требования
- [uv](https://github.com/astral-sh/uv) (менеджер пакетов Python)
- Python 3.12+
- PostgreSQL (или Docker Compose)

### 1. Клонирование и настройка окружения

```bash
cd server
cp .env.example .env
# отредактируйте .env — задайте реальные DATABASE_URL и другие параметры
```

Файл `.env` не коммитится (уже в `.gitignore`). Пример без секретов см. в `.env.example`.

### 2. Установка зависимостей

```bash
uv sync          # основные + dev зависимости
```

### 3. Запуск приложения (локально, без Docker)

Убедитесь, что PostgreSQL запущен и база `finance` создана, затем:

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Приложение доступно на `http://localhost:8000` (Swagger UI: `/docs`).

### 4. Запуск через Docker Compose (PostgreSQL + приложение)

```bash
docker compose up --build
```

Это поднимет два сервиса:
- `db` — PostgreSQL 16 (порт 5432, данные в именном volumen `finance_db_data`)
- `app` — FastAPI backend (порт 8000)

Остановить: `docker compose down`.

### 5. Подготовка БД и создание таблиц

Таблицы создаются автоматически при старте приложения (в `lifespan` через `Base.metadata.create_all`) — удобно для разработки и демо. В продакшене рекомендуется управлять схемой через Alembic-миграции вместо автосоздания.

Для сброса данных (Docker): `docker compose down -v` удалит volumen с данными БД.

## Тесты

Тесты используют in-memory SQLite (не требуют внешней PostgreSQL) и проверяют CRUD, связанные записи (категория → транзакции/бюджеты), обработку отсутствующих записей, дубликатов и валидации.

```bash
uv run pytest
```

Результат: 28 тестов, все проходят.

## Переменные окружения (.env)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `APP_NAME` | Название API | `Личный финучёт API` |
| `APP_VERSION` | Версия API | `0.1.0` |
| `DEBUG` | Режим отладки (включает SQL-логи) | `true` |
| `DATABASE_URL` | URL подключения к PostgreSQL (asyncpg) | `postgresql+asyncpg://postgres:postgres@localhost:5432/finance` |
| `ALLOWED_ORIGINS` | Разрешённые來源 CORS через запятую | `http://localhost:3000,http://127.0.0.1:3000` |

Пример без секретов: `.env.example`.
FRONTEND_DIR := client/frontend
BACKEND_DIR := server

.PHONY: dev build start lint backend-dev backend-test backend-lint backend-migrate backend-upgrade

# Frontend
dev:
	cd $(FRONTEND_DIR) && npm run dev
build:
	cd $(FRONTEND_DIR) && npm run build
start:
	cd $(FRONTEND_DIR) && npm run start
lint:
	cd $(FRONTEND_DIR) && npm run lint

# Backend
backend-dev:
	cd $(BACKEND_DIR) && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
backend-test:
	cd $(BACKEND_DIR) && uv run pytest
backend-lint:
	cd $(BACKEND_DIR) && uv run ruff check app tests migrations
backend-migrate:
	cd $(BACKEND_DIR) && uv run alembic revision --autogenerate -m "$(m)"
backend-upgrade:
	cd $(BACKEND_DIR) && uv run alembic upgrade head

FRONTEND_DIR := client/frontend

.PHONY: frontend-dev frontend-build frontend-start frontend-lint

dev:
	cd $(FRONTEND_DIR) && npm run dev
build:
	cd $(FRONTEND_DIR) && npm run build
start:
	cd $(FRONTEND_DIR) && npm run start
lint:
	cd $(FRONTEND_DIR) && npm run lint

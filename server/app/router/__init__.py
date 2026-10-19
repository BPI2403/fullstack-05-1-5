"""Роутеры API."""

from app.router.budgets import router as budgets_router
from app.router.categories import router as categories_router
from app.router.transactions import router as transactions_router

__all__ = ["categories_router", "transactions_router", "budgets_router"]
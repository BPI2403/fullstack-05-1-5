"""Агрегатор маршрутов API v1."""

from fastapi import APIRouter

from app.api.v1 import budgets, categories, transactions

api_router = APIRouter()
api_router.include_router(categories.router)
api_router.include_router(transactions.router)
api_router.include_router(budgets.router)

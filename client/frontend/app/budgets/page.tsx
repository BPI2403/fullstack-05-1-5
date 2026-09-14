"use client";

import BudgetProgress from "@/components/budget-progress";
import PageHeader from "@/components/page-header";
import {
  BUDGETS,
  CATEGORIES,
  MONTHLY_TRANSACTIONS,
  formatAmount,
} from "@/lib/data";
import { Budget as BudgetType } from "@/lib/types";
import { useState } from "react";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<readonly BudgetType[]>(BUDGETS);
  const [limit, setLimit] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const spentByCategory = (catId: string) =>
    MONTHLY_TRANSACTIONS.filter((t) => t.categoryId === catId).reduce(
      (s, t) => s + t.amount,
      0,
    );

  const totalSpent = budgets.reduce(
    (s, b) => s + spentByCategory(b.categoryId),
    0,
  );
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const overallPercent =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  const expenseCategories = CATEGORIES.filter((c) => c.type === "expense");
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id),
  );

  const addBudget = () => {
    if (!categoryId || !limit) return;
    const newBudget: BudgetType = {
      id: `b-${Date.now()}`,
      categoryId,
      limit: Number(limit),
      month: "2025-09",
    };
    setBudgets([newBudget, ...budgets]);
    setLimit("");
    setCategoryId("");
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Бюджеты"
        description="Настройка и отслеживание месячных лимитов"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat value={formatAmount(totalLimit)} label="Общий лимит" icon="🎯" />
        <Stat value={formatAmount(totalSpent)} label="Потрачено" icon="📊" />
        <Stat value={`${Math.round(overallPercent)}%`} label="Выполнение" icon="📈" />
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Добавить бюджет
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Выберите категорию</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              placeholder="Лимит (₽)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <button
            onClick={addBudget}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Сохранить
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Бюджеты не заданы
          </p>
        ) : (
          budgets.map((budget) => (
            <div
              key={budget.id}
              className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <BudgetProgress
                  categoryId={budget.categoryId}
                  spent={spentByCategory(budget.categoryId)}
                  limit={budget.limit}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-gray-900"
                  title="Изменить"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => deleteBudget(budget.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  icon: string;
}

function Stat({ label, value, icon }: StatProps) {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
      <span className="text-2xl mb-1 block">{icon}</span>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

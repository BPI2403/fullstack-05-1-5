"use client";

import CategoryBadge from "@/components/category-badge";
import PageHeader from "@/components/page-header";
import {
  CATEGORIES,
  CATEGORIES_BY_ID,
  TRANSACTIONS,
  formatAmount,
} from "@/lib/data";
import { useState } from "react";

type FilterType = "all" | "income" | "expense";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const expenseCategories = CATEGORIES.filter((c) => c.type === "expense");

  const filtered = TRANSACTIONS.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      CATEGORIES_BY_ID[t.categoryId]?.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      false;
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || t.categoryId === categoryFilter;
    const matchesFrom = !dateFrom || t.date >= dateFrom;
    const matchesTo = !dateTo || t.date <= dateTo;
    return matchesSearch && matchesType && matchesCategory && matchesFrom && matchesTo;
  }).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Транзакции"
        description="Все операции по доходам и расходам"
      />

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            >
              <option value="all">Все типы</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>
          <div>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Все категории</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Найдено: {filtered.length}
          </span>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          + Добавить операцию
        </button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900/50 text-left">
              <th className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                Дата
              </th>
              <th className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                Категория
              </th>
              <th className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                Описание
              </th>
              <th className="px-4 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">
                Сумма
              </th>
              <th className="px-4 py-2 text-center text-gray-500 dark:text-gray-400 font-medium">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Нет операций
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-gray-200 dark:border-gray-800 last:border-0"
                >
                  <td className="px-4 py-2">
                    {new Date(t.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <CategoryBadge categoryId={t.categoryId} />
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {t.description ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={
                        t.type === "income"
                          ? "text-emerald-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {t.type === "income" ? "+" : "-"} {" "}
                      {formatAmount(t.amount)} ₽
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center gap-1.5">
                      <button
                        type="button"
                        className="p-1 text-gray-600 hover:text-gray-900"
                        title="Изменить"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

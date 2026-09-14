"use client";

import BarChart from "@/components/bar-chart";
import PageHeader from "@/components/page-header";
import {
  CATEGORIES,
  MONTHLY_TRANSACTIONS,
  formatAmount,
} from "@/lib/data";
import { useState } from "react";

type Period = "month" | "quarter" | "year";
type Format = "csv" | "pdf";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [format, setFormat] = useState<Format>("csv");

  const expenses = MONTHLY_TRANSACTIONS.filter((t) => t.type === "expense");
  const totals: Record<string, number> = {};
  expenses.forEach((t) => {
    totals[t.categoryId] = (totals[t.categoryId] ?? 0) + t.amount;
  });
  const expensesByCategory = Object.entries(totals)
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);

  const incomeTotal = MONTHLY_TRANSACTIONS.filter(
    (t) => t.type === "income",
  ).reduce((s, t) => s + t.amount, 0);
  const expenseTotal = MONTHLY_TRANSACTIONS.filter(
    (t) => t.type === "expense",
  ).reduce((s, t) => s + t.amount, 0);

  const periodLabel: Record<Period, string> = {
    month: "Месяц",
    quarter: "Квартал",
    year: "Год",
  };
  const formatLabel: Record<Format, string> = {
    csv: "CSV",
    pdf: "PDF",
  };

  const download = () => {
    const rows = MONTHLY_TRANSACTIONS.map((t) => {
      const cat = CATEGORIES.find((c) => c.id === t.categoryId);
      return [
        new Date(t.date).toLocaleDateString("ru-RU"),
        t.type === "income" ? "Доход" : "Расход",
        cat?.name ?? "",
        formatAmount(t.amount),
        t.description ?? "",
      ].join(",");
    });
    const csv = ["Дата,Тип,Категория,Сумма,Описание", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finances-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Отчёты и экспорт"
        description="Распределение трат, динамика и выгрузка данных"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Расходы по категориям
          </h2>
          {expensesByCategory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нет расходов за выбранный период
            </p>
          ) : (
            <BarChart data={expensesByCategory} categories={CATEGORIES} />
          )}
        </section>

        <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Динамика доходов / расходов
          </h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            <li className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-300">Доходы</span>
              <span className="text-emerald-600 font-medium">
                + {formatAmount(incomeTotal)} ₽
              </span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-300">Расходы</span>
              <span className="text-red-600 font-medium">
                - {formatAmount(expenseTotal)} ₽
              </span>
            </li>
            <li className="flex justify-between py-2 font-semibold">
              <span className="text-gray-900 dark:text-gray-100">Итого</span>
              <span
                className={
                  incomeTotal - expenseTotal >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }
              >
                {incomeTotal - expenseTotal >= 0 ? "+" : "-"} {" "}
                {formatAmount(Math.abs(incomeTotal - expenseTotal))} ₽
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Экспорт отчёта
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Период
            </label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              <option value="month">{periodLabel.month}</option>
              <option value="quarter">{periodLabel.quarter}</option>
              <option value="year">{periodLabel.year}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Формат
            </label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
            >
              <option value="csv">{formatLabel.csv}</option>
              <option value="pdf">{formatLabel.pdf}</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-3 items-end">
            <button
              onClick={download}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Скачать
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Экспорт за {periodLabel[period]} в формате {formatLabel[format]}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

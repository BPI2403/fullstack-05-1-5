import type { Category } from "@/entities/category/model/types";
import type { Transaction } from "@/entities/transaction/model/types";

/** Чистые функции-селекторы над данными стора. */

export const getMonthTransactions = (
  transactions: Transaction[],
  month: string,
) => transactions.filter((t) => t.date.startsWith(month));

export const getSpentByCategory = (
  transactions: Transaction[],
  categoryId: string,
) =>
  transactions
    .filter((t) => t.categoryId === categoryId && t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export const getTotals = (transactions: Transaction[]): Totals => {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
};

export interface CategoryAmount {
  categoryId: string;
  amount: number;
}

export const getExpensesByCategory = (
  transactions: Transaction[],
): CategoryAmount[] => {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
};

export const getCategoryById =
  (categories: Category[]) => (categoryId: string) =>
    categories.find((c) => c.id === categoryId);

import type { Category } from "@/entities/category/model/types";
import type { Transaction } from "@/entities/transaction/model/types";
import type { Budget } from "@/entities/budget/model/types";
import {
  CURRENT_MONTH,
  DEMO_BUDGETS,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
} from "./demo-data";

export interface FinanceSnapshot {
  currentMonth: string;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

const LATENCY_MS = 600;

/**
 * Имитация запроса к API: отдаёт демо-данные с задержкой.
 * Добавьте к адресу страницы ?error=1, чтобы увидеть состояние ошибки,
 * и повторную загрузку по кнопке «Повторить».
 */
export function fetchFinanceSnapshot(): Promise<FinanceSnapshot> {
  const fail =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("error");

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) {
        reject(new Error("Имитация ошибки сети (демо-режим)"));
        return;
      }
      resolve({
        currentMonth: CURRENT_MONTH,
        categories: [...DEMO_CATEGORIES],
        transactions: [...DEMO_TRANSACTIONS],
        budgets: [...DEMO_BUDGETS],
      });
    }, LATENCY_MS);
  });
}

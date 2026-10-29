"use client";

/**
 * Стор финансов: данные пользователя с сервера + CRUD-действия.
 *
 * Загрузка стартует при входе пользователя и повторяется по кнопке
 * «Повторить». Мутации ходят в API и обновляют состояние ответами
 * сервера, поэтому интерфейс всегда показывает актуальные данные.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useAuth } from "@/entities/user/model/auth-store";
import type { Category, CategoryInput } from "@/entities/category/model/types";
import type {
  Transaction,
  TransactionInput,
} from "@/entities/transaction/model/types";
import type { Budget, BudgetInput } from "@/entities/budget/model/types";
import {
  createBudgetApi,
  createCategoryApi,
  createTransactionApi,
  deleteBudgetApi,
  deleteCategoryApi,
  deleteTransactionApi,
  fetchBudgets,
  fetchCategories,
  fetchTransactions,
  updateBudgetApi,
  updateCategoryApi,
  updateTransactionApi,
} from "./api";

export type FinanceStatus = "idle" | "loading" | "ready" | "error";

export interface FinanceState {
  status: FinanceStatus;
  error: string | null;
  currentMonth: string;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

type FinanceAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; currentMonth: string; categories: Category[]; transactions: Transaction[]; budgets: Budget[] }
  | { type: "loadError"; message: string }
  | { type: "reset" }
  | { type: "transactionAdd"; transaction: Transaction }
  | { type: "transactionUpdate"; id: string; transaction: Transaction }
  | { type: "transactionDelete"; id: string }
  | { type: "categoryAdd"; category: Category }
  | { type: "categoryUpdate"; id: string; category: Category }
  | { type: "categoryDelete"; id: string }
  | { type: "budgetAdd"; budget: Budget }
  | { type: "budgetUpdate"; id: string; budget: Budget }
  | { type: "budgetDelete"; id: string };

const initialState: FinanceState = {
  status: "idle",
  error: null,
  currentMonth: "",
  categories: [],
  transactions: [],
  budgets: [],
};

/** Текущий месяц в формате YYYY-MM (локальная дата). */
function currentMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "loadStart":
      return { ...state, status: "loading", error: null };
    case "loadSuccess":
      return {
        status: "ready",
        error: null,
        currentMonth: action.currentMonth,
        categories: action.categories,
        transactions: action.transactions,
        budgets: action.budgets,
      };
    case "loadError":
      return { ...state, status: "error", error: action.message };
    case "reset":
      return initialState;
    case "transactionAdd":
      return { ...state, transactions: [action.transaction, ...state.transactions] };
    case "transactionUpdate":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? action.transaction : t,
        ),
      };
    case "transactionDelete":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.id),
      };
    case "categoryAdd":
      return { ...state, categories: [action.category, ...state.categories] };
    case "categoryUpdate":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.id ? action.category : c,
        ),
      };
    case "categoryDelete":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
      };
    case "budgetAdd":
      return { ...state, budgets: [action.budget, ...state.budgets] };
    case "budgetUpdate":
      return {
        ...state,
        budgets: state.budgets.map((b) => (b.id === action.id ? action.budget : b)),
      };
    case "budgetDelete":
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.id),
      };
  }
}

export interface FinanceActions {
  reload: () => void;
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<void>;
  updateCategory: (id: string, input: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addBudget: (input: BudgetInput) => Promise<void>;
  updateBudget: (id: string, input: BudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

interface FinanceContextValue {
  state: FinanceState;
  actions: FinanceActions;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    dispatch({ type: "loadStart" });
    const month = currentMonth();
    try {
      // Загружаем всё параллельно; бюджеты ограничены текущим месяцем.
      const [categories, transactions, budgets] = await Promise.all([
        fetchCategories(),
        fetchTransactions(),
        fetchBudgets(month),
      ]);
      dispatch({
        type: "loadSuccess",
        currentMonth: month,
        categories,
        transactions,
        budgets,
      });
    } catch (error) {
      dispatch({
        type: "loadError",
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    }
  }, []);

  // Загрузка при входе, сброс при выходе.
  useEffect(() => {
    if (authStatus === "authenticated") {
      void load();
    } else if (authStatus === "guest") {
      dispatch({ type: "reset" });
    }
  }, [authStatus, load]);

  const actions = useMemo<FinanceActions>(
    () => ({
      reload: () => {
        void load();
      },
      addTransaction: async (input) => {
        const transaction = await createTransactionApi(input);
        dispatch({ type: "transactionAdd", transaction });
      },
      updateTransaction: async (id, input) => {
        const transaction = await updateTransactionApi(id, input);
        dispatch({ type: "transactionUpdate", id, transaction });
      },
      deleteTransaction: async (id) => {
        await deleteTransactionApi(id);
        dispatch({ type: "transactionDelete", id });
      },
      addCategory: async (input) => {
        const category = await createCategoryApi(input);
        dispatch({ type: "categoryAdd", category });
      },
      updateCategory: async (id, input) => {
        const category = await updateCategoryApi(id, input);
        dispatch({ type: "categoryUpdate", id, category });
      },
      deleteCategory: async (id) => {
        await deleteCategoryApi(id);
        dispatch({ type: "categoryDelete", id });
      },
      addBudget: async (input) => {
        const budget = await createBudgetApi(input);
        dispatch({ type: "budgetAdd", budget });
      },
      updateBudget: async (id, input) => {
        const budget = await updateBudgetApi(id, input);
        dispatch({ type: "budgetUpdate", id, budget });
      },
      deleteBudget: async (id) => {
        await deleteBudgetApi(id);
        dispatch({ type: "budgetDelete", id });
      },
    }),
    [load],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance должен вызываться внутри FinanceProvider");
  }
  return context;
}

export function useFinanceState(): FinanceState {
  return useFinance().state;
}

export function useFinanceActions(): FinanceActions {
  return useFinance().actions;
}

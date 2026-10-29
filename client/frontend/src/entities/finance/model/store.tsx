"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Category, CategoryInput } from "@/entities/category/model/types";
import type {
  Transaction,
  TransactionInput,
} from "@/entities/transaction/model/types";
import type { Budget, BudgetInput } from "@/entities/budget/model/types";
import { createId } from "@/shared/lib/utils";
import { fetchFinanceSnapshot, type FinanceSnapshot } from "./mock-api";

export type FinanceStatus = "loading" | "ready" | "error";

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
  | { type: "loadSuccess"; snapshot: FinanceSnapshot }
  | { type: "loadError"; message: string }
  | { type: "transactionAdd"; transaction: Transaction }
  | { type: "transactionUpdate"; id: string; patch: TransactionInput }
  | { type: "transactionDelete"; id: string }
  | { type: "categoryAdd"; category: Category }
  | { type: "categoryUpdate"; id: string; patch: CategoryInput }
  | { type: "categoryDelete"; id: string }
  | { type: "budgetAdd"; budget: Budget }
  | { type: "budgetUpdate"; id: string; patch: BudgetInput }
  | { type: "budgetDelete"; id: string };

const initialState: FinanceState = {
  status: "loading",
  error: null,
  currentMonth: "",
  categories: [],
  transactions: [],
  budgets: [],
};

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "loadStart":
      return { ...state, status: "loading", error: null };
    case "loadSuccess":
      return {
        status: "ready",
        error: null,
        currentMonth: action.snapshot.currentMonth,
        categories: action.snapshot.categories,
        transactions: action.snapshot.transactions,
        budgets: action.snapshot.budgets,
      };
    case "loadError":
      return { ...state, status: "error", error: action.message };
    case "transactionAdd":
      return { ...state, transactions: [action.transaction, ...state.transactions] };
    case "transactionUpdate":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
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
          c.id === action.id
            ? { ...c, ...action.patch, color: colorForType(action.patch.type) }
            : c,
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
        budgets: state.budgets.map((b) =>
          b.id === action.id ? { ...b, ...action.patch } : b,
        ),
      };
    case "budgetDelete":
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.id),
      };
  }
}

function colorForType(type: Category["type"]) {
  return type === "income" ? "#10b981" : "#ef4444";
}

export interface FinanceActions {
  reload: () => void;
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, patch: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (input: CategoryInput) => void;
  updateCategory: (id: string, patch: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  addBudget: (input: BudgetInput) => void;
  updateBudget: (id: string, patch: BudgetInput) => void;
  deleteBudget: (id: string) => void;
}

interface FinanceContextValue {
  state: FinanceState;
  actions: FinanceActions;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(() => {
    dispatch({ type: "loadStart" });
    fetchFinanceSnapshot()
      .then((snapshot) => dispatch({ type: "loadSuccess", snapshot }))
      .catch((error: unknown) =>
        dispatch({
          type: "loadError",
          message:
            error instanceof Error
              ? error.message
              : "Неизвестная ошибка загрузки",
        }),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useMemo<FinanceActions>(
    () => ({
      reload: load,
      addTransaction: (input) =>
        dispatch({
          type: "transactionAdd",
          transaction: { id: createId("t"), ...input },
        }),
      updateTransaction: (id, patch) =>
        dispatch({ type: "transactionUpdate", id, patch }),
      deleteTransaction: (id) => dispatch({ type: "transactionDelete", id }),
      addCategory: (input) =>
        dispatch({
          type: "categoryAdd",
          category: {
            id: createId("cat"),
            ...input,
            color: colorForType(input.type),
          },
        }),
      updateCategory: (id, patch) =>
        dispatch({ type: "categoryUpdate", id, patch }),
      deleteCategory: (id) => dispatch({ type: "categoryDelete", id }),
      addBudget: (input) =>
        dispatch({
          type: "budgetAdd",
          budget: {
            id: createId("b"),
            ...input,
            month: state.currentMonth,
          },
        }),
      updateBudget: (id, patch) => dispatch({ type: "budgetUpdate", id, patch }),
      deleteBudget: (id) => dispatch({ type: "budgetDelete", id }),
    }),
    [load, state.currentMonth],
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

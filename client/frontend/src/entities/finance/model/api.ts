/**
 * API-слой финансов: запросы к FastAPI и преобразование DTO в доменные модели.
 *
 * Сервер отдаёт snake_case и числовые id; клиент внутри работает со
 * строковыми id и необязательными иконками — преобразование живёт здесь,
 * чтобы остальные слои не знали формат API.
 */

import { apiFetch } from "@/shared/api/client";
import type { Budget, BudgetInput } from "@/entities/budget/model/types";
import type {
  Category,
  CategoryInput,
  CategoryType,
} from "@/entities/category/model/types";
import type {
  Transaction,
  TransactionInput,
  TransactionType,
} from "@/entities/transaction/model/types";

// ---------- DTO в формате API ----------

export interface TransactionDto {
  id: number;
  type: TransactionType;
  amount: number;
  category_id: number;
  date: string;
  description: string | null;
}

export interface CategoryDto {
  id: number;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
}

export interface BudgetDto {
  id: number;
  category_id: number;
  limit: number;
  month: string;
}

// ---------- Преобразование ----------

const DEFAULT_ICONS: Record<CategoryType, string> = {
  income: "💼",
  expense: "📦",
};

const DEFAULT_COLORS: Record<CategoryType, string> = {
  income: "#10b981",
  expense: "#ef4444",
};

function toCategory(dto: CategoryDto): Category {
  return {
    id: String(dto.id),
    name: dto.name,
    type: dto.type,
    icon: dto.icon ?? DEFAULT_ICONS[dto.type],
    color: dto.color ?? DEFAULT_COLORS[dto.type],
  };
}

function toTransaction(dto: TransactionDto): Transaction {
  return {
    id: String(dto.id),
    type: dto.type,
    amount: dto.amount,
    categoryId: String(dto.category_id),
    date: dto.date,
    description: dto.description ?? undefined,
  };
}

function toBudget(dto: BudgetDto): Budget {
  return {
    id: String(dto.id),
    categoryId: String(dto.category_id),
    limit: dto.limit,
    month: dto.month,
  };
}

// ---------- Запросы ----------

export interface TransactionFilter {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function fetchTransactions(filter: TransactionFilter = {}): Promise<Transaction[]> {
  const dtos = await apiFetch<TransactionDto[]>(
    withQuery("/api/v1/transactions", {
      type: filter.type,
      start_date: filter.startDate,
      end_date: filter.endDate,
      limit: "500",
    }),
  );
  return dtos.map(toTransaction);
}

export async function createTransactionApi(
  input: TransactionInput,
): Promise<Transaction> {
  const dto = await apiFetch<TransactionDto>("/api/v1/transactions", {
    method: "POST",
    body: {
      type: input.type,
      amount: input.amount,
      category_id: Number(input.categoryId),
      date: input.date,
      description: input.description ?? null,
    },
  });
  return toTransaction(dto);
}

export async function updateTransactionApi(
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  const dto = await apiFetch<TransactionDto>(`/api/v1/transactions/${id}`, {
    method: "PATCH",
    body: {
      type: input.type,
      amount: input.amount,
      category_id: Number(input.categoryId),
      date: input.date,
      description: input.description ?? null,
    },
  });
  return toTransaction(dto);
}

export async function deleteTransactionApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/transactions/${id}`, { method: "DELETE" });
}

export async function fetchCategories(): Promise<Category[]> {
  const dtos = await apiFetch<CategoryDto[]>("/api/v1/categories?limit=500");
  return dtos.map(toCategory);
}

export async function createCategoryApi(input: CategoryInput): Promise<Category> {
  const dto = await apiFetch<CategoryDto>("/api/v1/categories", {
    method: "POST",
    body: {
      name: input.name,
      type: input.type,
      icon: input.icon || null,
      color: null,
    },
  });
  return toCategory(dto);
}

export async function updateCategoryApi(
  id: string,
  input: CategoryInput,
): Promise<Category> {
  const dto = await apiFetch<CategoryDto>(`/api/v1/categories/${id}`, {
    method: "PATCH",
    body: {
      name: input.name,
      type: input.type,
      icon: input.icon || null,
      color: null,
    },
  });
  return toCategory(dto);
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/categories/${id}`, { method: "DELETE" });
}

export async function fetchBudgets(month?: string): Promise<Budget[]> {
  const dtos = await apiFetch<BudgetDto[]>(
    withQuery("/api/v1/budgets", { month, limit: "500" }),
  );
  return dtos.map(toBudget);
}

export async function createBudgetApi(input: BudgetInput): Promise<Budget> {
  const dto = await apiFetch<BudgetDto>("/api/v1/budgets", {
    method: "POST",
    body: {
      category_id: Number(input.categoryId),
      limit: input.limit,
      month: input.month,
    },
  });
  return toBudget(dto);
}

export async function updateBudgetApi(
  id: string,
  input: BudgetInput,
): Promise<Budget> {
  const dto = await apiFetch<BudgetDto>(`/api/v1/budgets/${id}`, {
    method: "PATCH",
    body: {
      category_id: Number(input.categoryId),
      limit: input.limit,
      month: input.month,
    },
  });
  return toBudget(dto);
}

export async function deleteBudgetApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/budgets/${id}`, { method: "DELETE" });
}

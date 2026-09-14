import { Budget, Category, Transaction } from "./types";

export const CATEGORIES: Category[] = [
  { id: "c1", name: "Зарплата", type: "income", icon: "💼", color: "#2563eb" },
  { id: "c2", name: "Фриланс", type: "income", icon: "🖥️", color: "#0ea5e0" },
  { id: "c3", name: "Подарки", type: "income", icon: "🎁", color: "#d946ef" },
  { id: "c4", name: "Еда", type: "expense", icon: "🍽️", color: "#ef4444" },
  { id: "c5", name: "Транспорт", type: "expense", icon: "🚇", color: "#f59e0b" },
  { id: "c6", name: "Развлечения", type: "expense", icon: "🎮", color: "#8b5cf6" },
  { id: "c7", name: "Коммунальные услуги", type: "expense", icon: "🏠", color: "#10b981" },
  { id: "c8", name: "Одежда", type: "expense", icon: "👕", color: "#db2727" },
];

export const CATEGORIES_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export const BUDGETS: Budget[] = [
  { id: "b1", categoryId: "c4", limit: 20000, month: "2025-09" },
  { id: "b2", categoryId: "c5", limit: 8000, month: "2025-09" },
  { id: "b3", categoryId: "c6", limit: 12000, month: "2025-09" },
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    type: "income",
    amount: 120000,
    categoryId: "c1",
    date: "2025-09-01",
    description: "Зарплата за август",
  },
  {
    id: "t2",
    type: "income",
    amount: 25000,
    categoryId: "c2",
    date: "2025-09-03",
    description: "Фриланс — сайт",
  },
  {
    id: "t3",
    type: "income",
    amount: 5000,
    categoryId: "c3",
    date: "2025-09-10",
    description: "Подарок на день рождения",
  },
  {
    id: "t4",
    type: "expense",
    amount: 4500,
    categoryId: "c4",
    date: "2025-09-02",
    description: "Продукты — супермаркет",
  },
  {
    id: "t5",
    type: "expense",
    amount: 3200,
    categoryId: "c4",
    date: "2025-09-05",
    description: "Обед в кафе",
  },
  {
    id: "t6",
    type: "expense",
    amount: 1800,
    categoryId: "c4",
    date: "2025-09-09",
    description: "Продукты — магазин",
  },
  {
    id: "t7",
    type: "expense",
    amount: 600,
    categoryId: "c5",
    date: "2025-09-04",
    description: "Проезд в метро",
  },
  {
    id: "t8",
    type: "expense",
    amount: 1500,
    categoryId: "c5",
    date: "2025-09-12",
    description: "Топливо",
  },
  {
    id: "t9",
    type: "expense",
    amount: 2200,
    categoryId: "c6",
    date: "2025-09-06",
    description: "Подписка на стрим",
  },
  {
    id: "t10",
    type: "expense",
    amount: 3100,
    categoryId: "c6",
    date: "2025-09-11",
    description: "Новая игра",
  },
  {
    id: "t11",
    type: "expense",
    amount: 7800,
    categoryId: "c7",
    date: "2025-09-07",
    description: "Коммунальные услуги",
  },
  {
    id: "t12",
    type: "expense",
    amount: 4300,
    categoryId: "c8",
    date: "2025-09-08",
    description: "Одежда — распродажа",
  },
];

export const CURRENT_MONTH = "2025-09";

export const MONTHLY_TRANSACTIONS = TRANSACTIONS.filter(
  (t) => t.date.startsWith(CURRENT_MONTH),
);

export const formatAmount = (amount: number) =>
  new Intl.NumberFormat("ru-RU").format(amount);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });

import BudgetProgress from "@/components/budget-progress";
import CategoryBadge from "@/components/category-badge";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import { BUDGETS, MONTHLY_TRANSACTIONS, formatAmount } from "@/lib/data";
import Link from "next/link";

const totalIncome = MONTHLY_TRANSACTIONS.filter(
  (t) => t.type === "income",
).reduce((s, t) => s + t.amount, 0);

const totalExpense = MONTHLY_TRANSACTIONS.filter(
  (t) => t.type === "expense",
).reduce((s, t) => s + t.amount, 0);

const balance = totalIncome - totalExpense;

const activeBudgets = BUDGETS.slice().sort((a, b) => {
  const spentA = MONTHLY_TRANSACTIONS.filter(
    (t) => t.categoryId === a.categoryId,
  ).reduce((s, t) => s + t.amount, 0);
  const spentB = MONTHLY_TRANSACTIONS.filter(
    (t) => t.categoryId === b.categoryId,
  ).reduce((s, t) => s + t.amount, 0);
  return spentB - spentA;
});

const recentTransactions = MONTHLY_TRANSACTIONS.slice().sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
).slice(0, 5);

export default function Home() {
  const spentByBudget = (budgetId: string) => {
    const budget = BUDGETS.find((b) => b.id === budgetId)!;
    return MONTHLY_TRANSACTIONS.filter(
      (t) => t.categoryId === budget.categoryId,
    ).reduce((s, t) => s + t.amount, 0);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Главная"
        description="Обзор финансов за сентябрь 2025 г."
        action={
          <Link
            href="/transactions"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Все операции →
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Баланс"
          value={`${formatAmount(balance)} ₽`}
          icon="💰"
          tone="accent"
        />
        <StatCard
          label="Доходы"
          value={`${formatAmount(totalIncome)} ₽`}
          icon="📈"
          tone="income"
        />
        <StatCard
          label="Расходы"
          value={`${formatAmount(totalExpense)} ₽`}
          icon="📉"
          tone="expense"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Бюджеты
          </h2>
          <div className="flex flex-col gap-4">
            {activeBudgets.map((budget) => (
              <BudgetProgress
                key={budget.id}
                categoryId={budget.categoryId}
                spent={spentByBudget(budget.id)}
                limit={budget.limit}
              />
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Последние операции
          </h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нет операций
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentTransactions.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <CategoryBadge categoryId={t.categoryId} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(t.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <span
                    className={
                      t.type === "income"
                        ? "text-emerald-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {t.type === "income" ? "+" : "-"} {formatAmount(t.amount)} ₽
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

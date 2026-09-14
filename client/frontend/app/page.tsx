import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  BUDGETS,
  MONTHLY_TRANSACTIONS,
  formatAmount,
  formatDate,
} from "@/lib/data";
import StatCard from "@/components/stat-card";
import BudgetProgress from "@/components/budget-progress";
import CategoryBadge from "@/components/category-badge";
import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

function spentByCategory(catId: string) {
  return MONTHLY_TRANSACTIONS.filter(
    (t) => t.categoryId === catId,
  ).reduce((s, t) => s + t.amount, 0);
}

export default function Home() {
  return (
    <div className="p-6">
      <PageHeader
        title="Главная"
        description="Обзор финансов за сентябрь 2025 г."
        action={
          <Button asChild variant="outline" size="sm">
            <a href="/transactions">Все операции →</a>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Баланс"
          value={`${formatAmount(balance)} ₽`}
          icon={<Wallet className="h-5 w-5 text-primary" />}
          description="Текущий остаток"
        />
        <StatCard
          title="Доходы"
          value={`${formatAmount(totalIncome)} ₽`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          description="Сентябрь 2025"
        />
        <StatCard
          title="Расходы"
          value={`${formatAmount(totalExpense)} ₽`}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          description="Сентябрь 2025"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Бюджеты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {activeBudgets.map((budget) => (
                <BudgetProgress
                  key={budget.id}
                  categoryId={budget.categoryId}
                  spent={spentByCategory(budget.categoryId)}
                  limit={budget.limit}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последние операции</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Нет операций
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryBadge categoryId={t.categoryId} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(t.date)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

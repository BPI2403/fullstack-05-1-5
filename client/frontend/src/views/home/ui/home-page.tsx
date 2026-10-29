"use client";

import Link from "next/link";
import {
  ArrowRight,
  ReceiptText,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { DataBoundary } from "@/shared/ui/data-boundary";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { CategoryBadge } from "@/entities/category/ui/category-badge";
import { BudgetProgress } from "@/entities/budget/ui/budget-progress";
import { useFinance, useFinanceState } from "@/entities/finance/model/store";
import {
  getMonthTransactions,
  getSpentByCategory,
  getTotals,
} from "@/entities/finance/model/selectors";
import {
  formatAmount,
  formatDate,
  formatSignedAmount,
  formatMonthLabel,
} from "@/shared/lib/format";

/** Главная: сводка за текущий месяц, бюджеты и последние операции. */
export function HomePage() {
  const { actions } = useFinance();
  const { status, currentMonth, transactions, budgets, categories } =
    useFinanceState();

  const monthly = getMonthTransactions(transactions, currentMonth);
  const totals = getTotals(monthly);

  const sortedBudgets = budgets
    .slice()
    .sort(
      (a, b) =>
        getSpentByCategory(monthly, b.categoryId) -
        getSpentByCategory(monthly, a.categoryId),
    );

  const recent = monthly
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  const monthLabel = formatMonthLabel(currentMonth);

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader
        title="Главная"
        description={
          monthLabel
            ? `Обзор финансов за ${monthLabel}`
            : "Загрузка данных…"
        }
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/transactions">
              Все операции
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <DataBoundary
        status={status}
        onRetry={actions.reload}
        skeleton={<HomeSkeleton />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Баланс"
            value={`${formatAmount(totals.balance)} ₽`}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            description="Текущий остаток"
          />
          <StatCard
            title="Доходы"
            value={`${formatAmount(totals.income)} ₽`}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            description={monthLabel}
          />
          <StatCard
            title="Расходы"
            value={`${formatAmount(totals.expense)} ₽`}
            icon={<TrendingDown className="h-5 w-5 text-red-600" />}
            description={monthLabel}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Бюджеты</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedBudgets.length === 0 ? (
                <EmptyState
                  icon={<Target className="h-6 w-6" />}
                  title="Бюджеты не заданы"
                  description="Задайте месячные лимиты в разделе «Бюджеты»."
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {sortedBudgets.map((budget) => (
                    <BudgetProgress
                      key={budget.id}
                      category={categories.find(
                        (c) => c.id === budget.categoryId,
                      )}
                      spent={getSpentByCategory(monthly, budget.categoryId)}
                      limit={budget.limit}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последние операции</CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <EmptyState
                  icon={<ReceiptText className="h-6 w-6" />}
                  title="Нет операций"
                  description="Добавьте первую операцию в разделе «Транзакции»."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((t) => (
                    <li
                      key={t.id}
                      className="animate-fade-in flex items-center justify-between py-2"
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
                        {formatSignedAmount(t.type, t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DataBoundary>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </>
  );
}

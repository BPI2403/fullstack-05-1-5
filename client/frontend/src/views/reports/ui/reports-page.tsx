"use client";

import { BarChart, type BarChartItem } from "@/shared/ui/bar-chart";
import { PageHeader } from "@/shared/ui/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { DataBoundary } from "@/shared/ui/data-boundary";
import { Skeleton } from "@/shared/ui/skeleton";
import { useFinanceState } from "@/entities/finance/model/store";
import {
  getExpensesByCategory,
  getMonthTransactions,
  getTotals,
} from "@/entities/finance/model/selectors";
import { ExportCard } from "@/features/report-export/ui/export-card";
import {
  formatAmount,
  formatSignedAmount,
  formatMonthLabel,
} from "@/shared/lib/format";

/** Отчёты: распределение трат, динамика доходов/расходов и экспорт. */
export function ReportsPage() {
  const { currentMonth, transactions, categories, status } = useFinanceState();

  const monthly = getMonthTransactions(transactions, currentMonth);
  const totals = getTotals(monthly);
  const monthLabel = formatMonthLabel(currentMonth);

  const chartData: BarChartItem[] = getExpensesByCategory(monthly).map(
    ({ categoryId, amount }) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        id: categoryId,
        label: category?.name ?? "—",
        amount,
        color: category?.color ?? "#3b82f6",
        icon: category?.icon,
      };
    },
  );

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader
        title="Отчёты и экспорт"
        description={
          monthLabel
            ? `Распределение трат, динамика и выгрузка данных — ${monthLabel}`
            : "Распределение трат, динамика и выгрузка данных"
        }
      />

      <DataBoundary
        status={status}
        skeleton={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BarChart
            title="Расходы по категориям"
            description={monthLabel}
            data={chartData}
            emptyHint="Расходов за месяц нет"
          />

          <Card>
            <CardHeader>
              <CardTitle>Динамика доходов / расходов</CardTitle>
            </CardHeader>
            <CardContent>
              {monthly.length === 0 ? (
                <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                  Операций за месяц нет
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  <li className="flex justify-between py-2">
                    <span className="text-muted-foreground">Доходы</span>
                    <span className="text-emerald-600 font-medium">
                      + {formatAmount(totals.income)} ₽
                    </span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span className="text-muted-foreground">Расходы</span>
                    <span className="text-red-600 font-medium">
                      - {formatAmount(totals.expense)} ₽
                    </span>
                  </li>
                  <li className="flex justify-between py-2 font-semibold">
                    <span>Итог</span>
                    <span
                      className={
                        totals.balance >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {formatSignedAmount(
                        totals.balance >= 0 ? "income" : "expense",
                        Math.abs(totals.balance),
                      )}
                    </span>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DataBoundary>

      <ExportCard />
    </div>
  );
}

"use client";

import { useState } from "react";
import { EllipsisVertical, Plus, Target } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DataBoundary } from "@/shared/ui/data-boundary";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  dropdownItemClass,
} from "@/shared/ui/dropdown-menu";
import { BudgetProgress } from "@/entities/budget/ui/budget-progress";
import { useFinance, useFinanceState } from "@/entities/finance/model/store";
import {
  getMonthTransactions,
  getSpentByCategory,
} from "@/entities/finance/model/selectors";
import type { Budget } from "@/entities/budget/model/types";
import { BudgetFormDialog } from "@/features/budget-form/ui/budget-form-dialog";
import { formatAmount, formatMonthLabel } from "@/shared/lib/format";

/** Бюджеты: месячные лимиты по категориям с прогрессом расхода. */
export function BudgetsPage() {
  const { actions } = useFinance();
  const { status, currentMonth, transactions, budgets, categories } =
    useFinanceState();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const monthly = getMonthTransactions(transactions, currentMonth);
  const monthLabel = formatMonthLabel(currentMonth);
  const spentOf = (budget: Budget) =>
    getSpentByCategory(monthly, budget.categoryId);

  const totalSpent = budgets.reduce((s, b) => s + spentOf(b), 0);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const overallPercent =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const remaining = totalLimit - totalSpent;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditing(budget);
    setFormOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    const name =
      categories.find((c) => c.id === budget.categoryId)?.name ?? "бюджет";
    if (confirm(`Удалить бюджет для категории «${name}»?`)) {
      actions.deleteBudget(budget.id);
    }
  };

  const sorted = budgets
    .slice()
    .sort((a, b) => spentOf(b) - spentOf(a));

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader
        title="Бюджеты"
        description={
          monthLabel
            ? `Настройка и отслеживание месячных лимитов — ${monthLabel}`
            : "Настройка и отслеживание месячных лимитов"
        }
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить бюджет
          </Button>
        }
      />

      <BudgetFormDialog
        key={formOpen ? `bud-${editing?.id ?? "new"}` : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <DataBoundary
        status={status}
        onRetry={actions.reload}
        skeleton={
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </>
        }
        isEmpty={budgets.length === 0}
        empty={
          <EmptyState
            icon={<Target className="h-6 w-6" />}
            title="Бюджеты не заданы"
            description="Задайте лимит трат для категории расходов на месяц."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить бюджет
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Общий лимит"
            value={`${formatAmount(totalLimit)} ₽`}
          />
          <StatCard
            title="Потрачено"
            value={`${formatAmount(totalSpent)} ₽`}
          />
          <StatCard
            title="Выполнение"
            value={`${Math.round(overallPercent)}%`}
          />
        </div>

        <div className="space-y-4">
          {sorted.map((budget) => (
            <Card key={budget.id} className="animate-fade-in">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <BudgetProgress
                      category={categories.find(
                        (c) => c.id === budget.categoryId,
                      )}
                      spent={spentOf(budget)}
                      limit={budget.limit}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className={dropdownItemClass}
                        onSelect={() => openEdit(budget)}
                      >
                        Изменить
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={dropdownItemClass}
                        onSelect={() => handleDelete(budget)}
                      >
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {remaining < 0 ? (
                  <p className="mt-2 text-xs text-destructive">
                    Общий бюджет превышен на {formatAmount(Math.abs(remaining))} ₽
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Осталось расходовать {formatAmount(remaining)} ₽
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DataBoundary>
    </div>
  );
}

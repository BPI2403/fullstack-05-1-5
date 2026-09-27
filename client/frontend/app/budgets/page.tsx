"use client";

import { useState } from "react";
import {
  BUDGETS,
  MONTHLY_TRANSACTIONS,
  formatAmount,
} from "@/lib/data";
import { Budget } from "@/lib/types";
import BudgetProgress from "@/components/budget-progress";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EllipsisVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  dropdownItemClass,
} from "@/components/ui/dropdown-menu";
import BudgetForm from "@/components/budget-form";

function spentByCategory(catId: string) {
  return MONTHLY_TRANSACTIONS.filter(
    (t) => t.categoryId === catId,
  ).reduce((s, t) => s + t.amount, 0);
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<readonly Budget[]>(BUDGETS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const totalSpent = budgets.reduce(
    (s, b) => s + spentByCategory(b.categoryId),
    0,
  );
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const overallPercent =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const remaining = totalLimit - totalSpent;

  const addBudget = (values: { categoryId: string; limit: number }) => {
    const newBudget: Budget = {
      id: `b-${Date.now()}`,
      ...values,
      month: "2025-09",
    };
    setBudgets([newBudget, ...budgets]);
    setFormOpen(false);
  };

  const updateBudget = (id: string, values: { categoryId: string; limit: number }) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, ...values } : b));
    setFormOpen(false);
    setEditingBudget(null);
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleSubmit = (values: { categoryId: string; limit: number }) => {
    if (editingBudget) {
      updateBudget(editingBudget.id, values);
    } else {
      addBudget(values);
    }
  };

  const sorted = budgets
    .slice()
    .sort(
      (a, b) =>
        spentByCategory(b.categoryId) - spentByCategory(a.categoryId),
    );

  return (
    <div className="p-6">
      <PageHeader
        title="Бюджеты"
        description="Настройка и отслеживание месячных лимитов"
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить бюджет
          </Button>
        }
      />

      <BudgetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        title={editingBudget ? "Изменить бюджет" : "Новый бюджет"}
        existingCategoryIds={budgets.filter(b => b.id !== editingBudget?.id).map((b) => b.categoryId)}
        defaultValues={editingBudget ? {
          categoryId: editingBudget.categoryId,
          limit: editingBudget.limit,
        } : undefined}
        isEditing={!!editingBudget}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCardInternal
          title="Общий лимит"
          value={`${formatAmount(totalLimit)} ₽`}
        />
        <StatCardInternal
          title="Потрачено"
          value={`${formatAmount(totalSpent)} ₽`}
        />
        <StatCardInternal
          title="Выполнение"
          value={`${Math.round(overallPercent)}%`}
        />
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Бюджеты не заданы</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((budget) => (
            <Card key={budget.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <BudgetProgress
                      categoryId={budget.categoryId}
                      spent={spentByCategory(budget.categoryId)}
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
                        onSelect={() => handleEdit(budget)}
                      >
                        Изменить
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={dropdownItemClass}
                        onSelect={() => deleteBudget(budget.id)}
                      >
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {remaining < 0 ? (
                  <p className="mt-2 text-xs text-destructive">
                    Общий превышен на{" "}
                    {formatAmount(Math.abs(remaining))} ₽
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
      )}
    </div>
  );
}

function StatCardInternal({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

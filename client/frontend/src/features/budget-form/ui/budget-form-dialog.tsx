"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useFinance, useFinanceState } from "@/entities/finance/model/store";
import type { Budget } from "@/entities/budget/model/types";
import { cn } from "@/shared/lib/utils";
import { validateBudgetForm, type BudgetFormValues } from "../model/schema";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Редактируемый бюджет; null / undefined — создание нового. */
  editing?: Budget | null;
}

const emptyValues: BudgetFormValues = { categoryId: "", limit: "" };

/** Диалог создания/редактирования бюджета на текущий месяц. */
export function BudgetFormDialog({
  open,
  onOpenChange,
  editing = null,
}: BudgetFormDialogProps) {
  const { categories, budgets } = useFinanceState();
  const { addBudget, updateBudget } = useFinance().actions;

  // Диалог монтируется заново при каждом открытии (key в родителе),
  // поэтому значения редактируемого бюджета берутся прямо в useState.
  const [values, setValues] = useState<BudgetFormValues>(
    editing
      ? { categoryId: editing.categoryId, limit: String(editing.limit) }
      : emptyValues,
  );
  const [errors, setErrors] = useState<Partial<
    Record<keyof BudgetFormValues, string>
  > | null>(null);
  const [shaking, setShaking] = useState(false);

  // Категории расходов, у которых ещё нет бюджета (кроме редактируемого).
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.type === "expense" &&
          !budgets.some(
            (b) => b.categoryId === c.id && b.id !== editing?.id,
          ),
      ),
    [categories, budgets, editing?.id],
  );


  const patch = (partial: Partial<BudgetFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const clearError = (field: keyof BudgetFormValues) =>
    setErrors((prev) => (prev ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = () => {
    const nextErrors = validateBudgetForm(values);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      setShaking(true);
      return;
    }
    const input = {
      categoryId: values.categoryId,
      limit: Number(values.limit.replace(",", ".")),
    };
    if (editing) {
      updateBudget(editing.id, input);
    } else {
      addBudget(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div
          className={cn(shaking && "animate-shake")}
          onAnimationEnd={() => setShaking(false)}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Изменить бюджет" : "Новый бюджет"}
            </DialogTitle>
            <DialogDescription>
              Задайте лимит трат для категории на месяц
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              label="Категория"
              required
              error={errors?.categoryId}
              hint={
                availableCategories.length === 0 && !editing
                  ? "Все категории расходов уже имеют бюджет"
                  : undefined
              }
            >
              <Select
                value={values.categoryId}
                onValueChange={(v) => {
                  patch({ categoryId: v });
                  clearError("categoryId");
                }}
                disabled={!editing && availableCategories.length === 0}
              >
                <SelectTrigger
                  className={cn(
                    "w-full",
                    errors?.categoryId &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                >
                  <SelectValue placeholder="Выберите категорию">
                    {(() => {
                      const selected = categories.find(
                        (c) => c.id === values.categoryId,
                      );
                      return selected
                        ? `${selected.icon} ${selected.name}`
                        : undefined;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Категории расходов</SelectLabel>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span>{c.icon}</span>
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Лимит (₽)"
              required
              error={errors?.limit}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                value={values.limit}
                aria-invalid={Boolean(errors?.limit)}
                className={cn(
                  errors?.limit &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                onChange={(e) => {
                  patch({ limit: e.target.value });
                  clearError("limit");
                }}
              />
            </FormField>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="button" onClick={handleSubmit}>
                {editing ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

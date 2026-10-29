"use client";

import { useState } from "react";
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
import type { Transaction } from "@/entities/transaction/model/types";
import type { TransactionType } from "@/entities/transaction/model/types";
import { cn } from "@/shared/lib/utils";
import { ApiError } from "@/shared/api/client";
import {
  toTransactionInput,
  validateTransactionForm,
  type TransactionFormValues,
} from "../model/schema";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Редактируемая операция; null / undefined — создание новой. */
  editing?: Transaction | null;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyValues: TransactionFormValues = {
  type: "expense",
  amount: "",
  categoryId: "",
  date: today(),
  description: "",
};

function valuesFrom(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    categoryId: transaction.categoryId,
    date: transaction.date,
    description: transaction.description ?? "",
  };
}

/** Диалог создания/редактирования операции с клиентской валидацией. */
export function TransactionFormDialog({
  open,
  onOpenChange,
  editing = null,
}: TransactionFormDialogProps) {
  const { categories } = useFinanceState();
  const { addTransaction, updateTransaction } = useFinance().actions;

  // Диалог монтируется заново при каждом открытии (key в родителе),
  // поэтому значения редактируемой операции берутся прямо в useState.
  const [values, setValues] = useState<TransactionFormValues>(
    editing ? valuesFrom(editing) : emptyValues,
  );
  const [errors, setErrors] = useState<Partial<
    Record<keyof TransactionFormValues, string>
  > | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shaking, setShaking] = useState(false);


  const patch = (partial: Partial<TransactionFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const clearError = (field: keyof TransactionFormValues) =>
    setErrors((prev) => (prev ? { ...prev, [field]: undefined } : prev));

  const handleTypeChange = (type: TransactionType) => {
    const currentCategory = categories.find(
      (c) => c.id === values.categoryId,
    );
    // При смене типа сбрасываем категорию, не подходящую по типу.
    const keepCategory =
      currentCategory && currentCategory.type === type
        ? values.categoryId
        : "";
    patch({ type, categoryId: keepCategory });
    clearError("categoryId");
  };

  const handleSubmit = async () => {
    const nextErrors = validateTransactionForm(values);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      setShaking(true);
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const input = toTransactionInput(values);
      if (editing) {
        await updateTransaction(editing.id, input);
      } else {
        await addTransaction(input);
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields?.category_id) {
          setErrors({ categoryId: error.fields.category_id });
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError("Не удалось сохранить операцию. Попробуйте ещё раз.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div
          className={cn(shaking && "animate-shake")}
          onAnimationEnd={() => setShaking(false)}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Изменить операцию" : "Новая операция"}
            </DialogTitle>
            <DialogDescription>
              Заполните данные операции — поля со звёздочкой обязательны
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField label="Тип операции" required>
              <Select
                value={values.type}
                onValueChange={(v) => handleTypeChange(v as TransactionType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {values.type === "income" ? "Доход" : "Расход"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Тип операции</SelectLabel>
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="expense">Расход</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Сумма (₽)"
              required
              error={errors?.amount}
              htmlFor="transaction-amount"
            >
              <Input
                id="transaction-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                value={values.amount}
                aria-invalid={Boolean(errors?.amount)}
                className={cn(
                  errors?.amount &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                onChange={(e) => {
                  patch({ amount: e.target.value });
                  clearError("amount");
                }}
              />
            </FormField>

            <FormField
              label="Категория"
              required
              error={errors?.categoryId}
            >
              <Select
                value={values.categoryId}
                onValueChange={(v) => {
                  patch({ categoryId: v });
                  clearError("categoryId");
                }}
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
                  <SelectLabel>Категории</SelectLabel>
                  {categories
                    .filter((c) => c.type === values.type)
                    .map((c) => (
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

            <FormField label="Дата" required error={errors?.date}>
              <Input
                type="date"
                value={values.date}
                aria-invalid={Boolean(errors?.date)}
                className={cn(
                  errors?.date &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                onChange={(e) => {
                  patch({ date: e.target.value });
                  clearError("date");
                }}
              />
            </FormField>

            <FormField
              label="Описание"
              error={errors?.description}
              hint="Необязательно, до 200 символов"
            >
              <Input
                placeholder="Комментарий"
                value={values.description}
                aria-invalid={Boolean(errors?.description)}
                className={cn(
                  errors?.description &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                onChange={(e) => {
                  patch({ description: e.target.value });
                  clearError("description");
                }}
              />
            </FormField>

            {serverError ? (
              <p role="alert" className="animate-fade-in text-xs text-destructive">
                {serverError}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving
                  ? "Сохраняем…"
                  : editing
                    ? "Сохранить"
                    : "Добавить"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

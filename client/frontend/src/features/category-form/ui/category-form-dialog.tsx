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
import type { Category, CategoryType } from "@/entities/category/model/types";
import { cn } from "@/shared/lib/utils";
import { ApiError } from "@/shared/api/client";
import { validateCategoryForm, type CategoryFormValues } from "../model/schema";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Редактируемая категория; null / undefined — создание новой. */
  editing?: Category | null;
}

const ICONS = ["🍽️", "🚇", "🎮", "🏠", "👕", "💼", "🎁", "📦", "📚", "🐾"];

const emptyValues: CategoryFormValues = {
  name: "",
  type: "expense",
  icon: "📦",
};

/** Диалог создания/редактирования категории с валидацией и проверкой уникальности. */
export function CategoryFormDialog({
  open,
  onOpenChange,
  editing = null,
}: CategoryFormDialogProps) {
  const { categories } = useFinanceState();
  const { addCategory, updateCategory } = useFinance().actions;

  // Диалог монтируется заново при каждом открытии (key в родителе),
  // поэтому значения редактируемой категории берутся прямо в useState.
  const [values, setValues] = useState<CategoryFormValues>(
    editing
      ? { name: editing.name, type: editing.type, icon: editing.icon }
      : emptyValues,
  );
  const [errors, setErrors] = useState<Partial<
    Record<keyof CategoryFormValues, string>
  > | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shaking, setShaking] = useState(false);


  const patch = (partial: Partial<CategoryFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const clearError = (field: keyof CategoryFormValues) =>
    setErrors((prev) => (prev ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = async () => {
    const nextErrors = validateCategoryForm(values, categories, editing?.id);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      setShaking(true);
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const input = {
        name: values.name.trim(),
        type: values.type,
        icon: values.icon,
      };
      if (editing) {
        await updateCategory(editing.id, input);
      } else {
        await addCategory(input);
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields?.name) {
          setErrors({ name: error.fields.name });
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError("Не удалось сохранить категорию. Попробуйте ещё раз.");
      }
    } finally {
      setSaving(false);
    }
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
              {editing ? "Изменить категорию" : "Новая категория"}
            </DialogTitle>
            <DialogDescription>
              Укажите название и тип категории
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              label="Название"
              required
              error={errors?.name}
              hint="Например: Еда, Фриланс"
            >
              <Input
                placeholder="Например: Еда"
                value={values.name}
                aria-invalid={Boolean(errors?.name)}
                className={cn(
                  errors?.name &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                onChange={(e) => {
                  patch({ name: e.target.value });
                  clearError("name");
                }}
              />
            </FormField>

            <FormField label="Тип" required>
              <Select
                value={values.type}
                onValueChange={(v) => patch({ type: v as CategoryType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {values.type === "income" ? "Доход" : "Расход"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Тип категории</SelectLabel>
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="expense">Расход</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Иконка" required error={errors?.icon}>
              <Select
                value={values.icon}
                onValueChange={(v) => {
                  patch({ icon: v });
                  clearError("icon");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Иконка">{values.icon}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Иконка</SelectLabel>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <span>{icon}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

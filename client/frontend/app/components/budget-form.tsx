"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { CATEGORIES } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Budget } from "@/lib/types";

export interface BudgetFormProps {
  defaultValues?: Partial<Pick<Budget, "categoryId" | "limit">>;
  onSubmit: (values: { categoryId: string; limit: number }) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  existingCategoryIds?: string[];
  isEditing?: boolean;
}

export default function BudgetForm({
  defaultValues,
  onSubmit,
  trigger,
  open,
  onOpenChange,
  title = "Новый бюджет",
  existingCategoryIds = [],
  isEditing = false,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(
    defaultValues?.categoryId ?? "",
  );
  const [limit, setLimit] = useState(defaultValues?.limit ? String(defaultValues.limit) : "");

  const availableCategories = CATEGORIES.filter(
    (c) =>
      c.type === "expense" && !existingCategoryIds.includes(c.id),
  );

  useEffect(() => {
    if (open && defaultValues) {
      setCategoryId(defaultValues.categoryId ?? "");
      setLimit(defaultValues.limit ? String(defaultValues.limit) : "");
    } else if (!open) {
      setCategoryId("");
      setLimit("");
    }
  }, [open, defaultValues]);

  const handleSubmit = () => {
    const num = Number(limit);
    if (!categoryId || !num) return;
    onSubmit({ categoryId, limit: num });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Задайте лимит трат для категории на месяц
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
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
          </div>
          <div>
            <Label>Лимит (₽)</Label>
            <Input
              type="number"
              placeholder="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

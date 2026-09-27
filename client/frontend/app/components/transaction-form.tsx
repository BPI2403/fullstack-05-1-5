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

export interface TransactionFormProps {
  defaultValues?: Partial<{
    type: "income" | "expense";
    amount: string;
    categoryId: string;
    date: string;
    description: string;
  }>;
  onSubmit: (values: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    date: string;
    description: string;
  }) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  isEditing?: boolean;
}

export default function TransactionForm({
  defaultValues,
  onSubmit,
  trigger,
  open,
  onOpenChange,
  title = "Новая операция",
  isEditing = false,
}: TransactionFormProps) {
  const [type, setType] = useState(defaultValues?.type ?? "expense");
  const [amount, setAmount] = useState(defaultValues?.amount ?? "");
  const [categoryId, setCategoryId] = useState(
    defaultValues?.categoryId ?? "",
  );
  const [date, setDate] = useState(
    defaultValues?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  );

  // Reset form when dialog opens/closes or when defaultValues change
  useEffect(() => {
    if (open && defaultValues) {
      setType(defaultValues.type ?? "expense");
      setAmount(defaultValues.amount ?? "");
      setCategoryId(defaultValues.categoryId ?? "");
      setDate(defaultValues.date ?? new Date().toISOString().slice(0, 10));
      setDescription(defaultValues.description ?? "");
    } else if (!open) {
      // Reset to defaults when closed
      setType("expense");
      setAmount("");
      setCategoryId("");
      setDate(new Date().toISOString().slice(0, 10));
      setDescription("");
    }
  }, [open, defaultValues]);

  const handleSubmit = () => {
    const num = Number(amount);
    if (!num || !categoryId) return;
    onSubmit({ type, amount: num, categoryId, date, description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Заполните данные операции</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Тип операции</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "income" | "expense")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectLabel>Тип операции</SelectLabel>
                <SelectItem value="income">Доход</SelectItem>
                <SelectItem value="expense">Расход</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Сумма (₽)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <Label>Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectLabel>Категории</SelectLabel>
                {CATEGORIES.filter((c) => c.type === type).map((c) => (
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
            <Label>Дата</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Описание</Label>
            <Input
              placeholder="Комментарий"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

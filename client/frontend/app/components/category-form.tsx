"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
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
import { Category } from "@/lib/types";

export interface CategoryFormProps {
  defaultValues?: Partial<Pick<Category, "name" | "type" | "icon">>;
  onSubmit: (values: {
    name: string;
    type: "income" | "expense";
    icon: string;
  }) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  isEditing?: boolean;
}

const ICONS = ["🍽️", "🚇", "🎮", "🏠", "👕", "💼", "🎁", "📦"];

export default function CategoryForm({
  defaultValues,
  onSubmit,
  trigger,
  open,
  onOpenChange,
  title = "Новая категория",
  isEditing = false,
}: CategoryFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [type, setType] = useState<"income" | "expense">(
    defaultValues?.type ?? "expense",
  );
  const [icon, setIcon] = useState(defaultValues?.icon ?? "📦");

  useEffect(() => {
    if (open && defaultValues) {
      setName(defaultValues.name ?? "");
      setType(defaultValues.type ?? "expense");
      setIcon(defaultValues.icon ?? "📦");
    } else if (!open) {
      setName("");
      setType("expense");
      setIcon("📦");
    }
  }, [open, defaultValues]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), type, icon });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Укажите название и тип категории
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Название</Label>
            <Input
              placeholder="Например: Еда"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>Тип</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "income" | "expense")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectLabel>Тип категории</SelectLabel>
                <SelectItem value="income">Доход</SelectItem>
                <SelectItem value="expense">Расход</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Иконка</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Иконка" />
              </SelectTrigger>
              <SelectContent>
                <SelectLabel>Иконка</SelectLabel>
                {ICONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    <span className="flex items-center gap-2">
                      <span>{i}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { Category } from "@/lib/types";
import CategoryForm from "@/components/category-form";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  dropdownItemClass,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [formOpen, setFormOpen] = useState(false);

  const addCategory = (values: {
    name: string;
    type: "income" | "expense";
    icon: string;
  }) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      ...values,
      color: values.type === "income" ? "#10b981" : "#ef4444",
    };
    setCategories([newCategory, ...categories]);
    setFormOpen(false);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const incomes = categories.filter((c) => c.type === "income");
  const expenses = categories.filter((c) => c.type === "expense");

  return (
    <div className="p-6">
      <PageHeader
        title="Категории"
        description="Управление категориями доходов и расходов"
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить категорию
          </Button>
        }
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addCategory}
        title="Новая категория"
      />

      <CategoryTable
        title="Доходы"
        items={incomes}
        onDelete={deleteCategory}
      />
      <CategoryTable
        title="Расходы"
        items={expenses}
        onDelete={deleteCategory}
      />
    </div>
  );
}

interface CategoryTableProps {
  title: string;
  items: Category[];
  onDelete: (id: string) => void;
}

function CategoryTable({ title, items, onDelete }: CategoryTableProps) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-foreground">{title}</h2>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Категория</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-20 text-center">
                  Категории не добавлены
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        c.type === "income"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {c.type === "income" ? "Доход" : "Расход"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className={dropdownItemClass}>
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={dropdownItemClass}
                          onSelect={() => onDelete(c.id)}
                        >
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

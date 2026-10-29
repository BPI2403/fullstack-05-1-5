"use client";

import { useState } from "react";
import { EllipsisVertical, Plus, Tags } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { DataBoundary } from "@/shared/ui/data-boundary";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  dropdownItemClass,
} from "@/shared/ui/dropdown-menu";
import { useFinance, useFinanceState } from "@/entities/finance/model/store";
import type { Category } from "@/entities/category/model/types";
import { CategoryFormDialog } from "@/features/category-form/ui/category-form-dialog";

/** Категории: списки доходов и расходов, CRUD. */
export function CategoriesPage() {
  const { actions } = useFinance();
  const { status, categories } = useFinanceState();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (confirm(`Удалить категорию «${category.name}»?`)) {
      actions.deleteCategory(category.id);
    }
  };

  const incomes = categories.filter((c) => c.type === "income");
  const expenses = categories.filter((c) => c.type === "expense");

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader
        title="Категории"
        description="Управление категориями доходов и расходов"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить категорию
          </Button>
        }
      />

      <CategoryFormDialog
        key={formOpen ? `cat-${editing?.id ?? "new"}` : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <DataBoundary
        status={status}
        onRetry={actions.reload}
        skeleton={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
        isEmpty={categories.length === 0}
        empty={
          <EmptyState
            icon={<Tags className="h-6 w-6" />}
            title="Категорий пока нет"
            description="Создайте категории, чтобы относить к ним операции."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить категорию
              </Button>
            }
          />
        }
      >
        <CategoryTable
          title="Доходы"
          items={incomes}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
        <CategoryTable
          title="Расходы"
          items={expenses}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </DataBoundary>
    </div>
  );
}

interface CategoryTableProps {
  title: string;
  items: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function CategoryTable({ title, items, onEdit, onDelete }: CategoryTableProps) {
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
                <TableRow key={c.id} className="animate-fade-in">
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
                        <DropdownMenuItem
                          className={dropdownItemClass}
                          onSelect={() => onEdit(c)}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={dropdownItemClass}
                          onSelect={() => onDelete(c)}
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

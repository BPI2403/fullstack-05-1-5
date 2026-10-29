"use client";

import { useMemo, useState } from "react";
import { Plus, ReceiptText, SearchX } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DataBoundary } from "@/shared/ui/data-boundary";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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
import NoSSR from "@/shared/ui/no-ssr";
import { CategoryBadge } from "@/entities/category/ui/category-badge";
import { useFinance, useFinanceState } from "@/entities/finance/model/store";
import type { Transaction } from "@/entities/transaction/model/types";
import { TransactionFormDialog } from "@/features/transaction-form/ui/transaction-form-dialog";
import {
  formatDateFull,
  formatSignedAmount,
} from "@/shared/lib/format";
import { EllipsisVertical } from "lucide-react";

type FilterType = "all" | "income" | "expense";

interface Filters {
  search: string;
  type: FilterType;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: Filters = {
  search: "",
  type: "all",
  categoryId: "all",
  dateFrom: "",
  dateTo: "",
};

/** Транзакции: список, поиск, фильтры, CRUD. */
export function TransactionsPage() {
  const { actions } = useFinance();
  const { status, transactions, categories } = useFinanceState();

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const patchFilters = (partial: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...partial }));

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        const categoryName =
          categories.find((c) => c.id === t.categoryId)?.name ?? "";
        const matchesSearch =
          !search ||
          t.description?.toLowerCase().includes(search) ||
          categoryName.toLowerCase().includes(search);
        const matchesType =
          filters.type === "all" || t.type === filters.type;
        const matchesCategory =
          filters.categoryId === "all" ||
          t.categoryId === filters.categoryId;
        const matchesFrom = !filters.dateFrom || t.date >= filters.dateFrom;
        const matchesTo = !filters.dateTo || t.date <= filters.dateTo;
        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, categories, filters]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    if (confirm(`Удалить операцию «${transaction.description ?? "Без описания"}»?`)) {
      actions.deleteTransaction(transaction.id);
    }
  };

  const filtersActive =
    filters.search !== "" ||
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader
        title="Транзакции"
        description="Все операции по доходам и расходам"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить операцию
          </Button>
        }
      />

      {status === "ready" ? (
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Поиск по описанию или категории..."
            value={filters.search}
            onChange={(e) => patchFilters({ search: e.target.value })}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <NoSSR
              fallback={
                <div className="h-10 w-[140px] rounded-md border border-input bg-muted" />
              }
            >
              <Select
                value={filters.type}
                onValueChange={(v) =>
                  patchFilters({ type: v as FilterType })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Тип операции</SelectLabel>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="income">Доходы</SelectItem>
                  <SelectItem value="expense">Расходы</SelectItem>
                </SelectContent>
              </Select>
            </NoSSR>

            <NoSSR
              fallback={
                <div className="h-10 w-[160px] rounded-md border border-input bg-muted" />
              }
            >
              <Select
                value={filters.categoryId}
                onValueChange={(v) => patchFilters({ categoryId: v })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Категории</SelectLabel>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NoSSR>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => patchFilters({ dateFrom: e.target.value })}
              className="w-[130px]"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => patchFilters({ dateTo: e.target.value })}
              className="w-[130px]"
            />
            {filtersActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(defaultFilters)}
              >
                Сбросить
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <TransactionFormDialog
        key={formOpen ? `tx-${editing?.id ?? "new"}` : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <DataBoundary
        status={status}
        onRetry={actions.reload}
        skeleton={
          <div className="rounded-md border border-border bg-card p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full mb-2" />
            ))}
          </div>
        }
        isEmpty={transactions.length === 0}
        empty={
          <EmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title="Операций пока нет"
            description="Добавьте первую операцию — доход или расход."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить операцию
              </Button>
            }
          />
        }
      >
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="text-center">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      className="border-0"
                      icon={<SearchX className="h-6 w-6" />}
                      title="Ничего не найдено"
                      description="По текущим фильтрам операций нет. Попробуйте сбросить фильтры."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className="animate-fade-in">
                    <TableCell className="whitespace-nowrap">
                      {formatDateFull(t.date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <CategoryBadge categoryId={t.categoryId} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          t.type === "income"
                            ? "text-emerald-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {formatSignedAmount(t.type, t.amount)}
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
                            onSelect={() => openEdit(t)}
                          >
                            Изменить
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={dropdownItemClass}
                            onSelect={() => handleDelete(t)}
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
        {transactions.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Показано операций: {filtered.length} из {transactions.length}
          </p>
        ) : null}
      </DataBoundary>
    </div>
  );
}

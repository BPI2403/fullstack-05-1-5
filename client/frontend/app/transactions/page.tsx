"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORIES_BY_ID,
  TRANSACTIONS,
  formatAmount,
} from "@/lib/data";
import { Transaction } from "@/lib/types";
import CategoryBadge from "@/components/category-badge";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  dropdownItemClass,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EllipsisVertical } from "lucide-react";
import TransactionForm from "@/components/transaction-form";

type FilterType = "all" | "income" | "expense";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = transactions
    .filter((t) => {
      const matchesSearch =
        !!t.description?.toLowerCase().includes(search.toLowerCase()) ||
        !!CATEGORIES_BY_ID[t.categoryId]?.name
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" || t.categoryId === categoryFilter;
      const matchesFrom = !dateFrom || t.date >= dateFrom;
      const matchesTo = !dateTo || t.date <= dateTo;
      return matchesSearch && matchesType && matchesCategory && matchesFrom && matchesTo;
    })
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const addTransaction = (values: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    date: string;
    description: string;
  }) => {
    const newTransaction: Transaction = {
      id: `t-${Date.now()}`,
      ...values,
    };
    setTransactions([newTransaction, ...transactions]);
    setFormOpen(false);
  };

  const expenseCategories = CATEGORIES.filter((c) => c.type === "expense");

  return (
    <div className="p-6">
      <PageHeader
        title="Транзакции"
        description="Все операции по доходам и расходам"
        action={
          <Button onClick={() => setFormOpen(true)}>
            + Добавить операцию
          </Button>
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Поиск по описанию или категории..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as FilterType)}
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

          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectLabel>Категории</SelectLabel>
              <SelectItem value="all">Все категории</SelectItem>
              {expenseCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[130px]"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[130px]"
          />
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Сбросить
          </Button>
        </div>
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addTransaction}
        title="Новая операция"
      />

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
                <TableCell colSpan={5} className="h-24 text-center">
                  Нет операций
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
                      {t.type === "income" ? "+" : "-"} {formatAmount(t.amount)} ₽
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
                          onSelect={() => {}}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={dropdownItemClass}
                          onSelect={() => {}}
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
    </div>
  );
}

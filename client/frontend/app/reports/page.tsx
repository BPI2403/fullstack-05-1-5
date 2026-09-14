"use client";

import { useState } from "react";
import { CATEGORIES, MONTHLY_TRANSACTIONS, formatAmount } from "@/lib/data";
import PageHeader from "@/components/page-header";
import BarChart from "@/components/bar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";

type Period = "month" | "quarter" | "year";
type Format = "csv" | "pdf";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [format, setFormat] = useState<Format>("csv");

  const expenses = MONTHLY_TRANSACTIONS.filter((t) => t.type === "expense");
  const totals: Record<string, number> = {};
  expenses.forEach((t) => {
    totals[t.categoryId] = (totals[t.categoryId] ?? 0) + t.amount;
  });
  const expensesByCategory = Object.entries(totals)
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);

  const incomeTotal = MONTHLY_TRANSACTIONS.filter(
    (t) => t.type === "income",
  ).reduce((s, t) => s + t.amount, 0);
  const expenseTotal = MONTHLY_TRANSACTIONS.filter(
    (t) => t.type === "expense",
  ).reduce((s, t) => s + t.amount, 0);

  const periodLabel: Record<Period, string> = {
    month: "Месяц",
    quarter: "Квартал",
    year: "Год",
  };
  const formatLabel: Record<Format, string> = {
    csv: "CSV",
    pdf: "PDF",
  };

  const download = () => {
    const rows = MONTHLY_TRANSACTIONS.map((t) => {
      const cat = CATEGORIES.find((c) => c.id === t.categoryId);
      return [
        new Date(t.date).toLocaleDateString("ru-RU"),
        t.type === "income" ? "Доход" : "Расход",
        cat?.name ?? "",
        formatAmount(t.amount),
        t.description ?? "",
      ].join(",");
    });
    const csv = ["Дата,Тип,Категория,Сумма,Описание", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finances-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Отчёты и экспорт"
        description="Распределение трат, динамика и выгрузка данных"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          title="Расходы по категориям"
          data={expensesByCategory}
          categories={CATEGORIES}
        />

        <Card>
          <CardHeader>
            <CardTitle>Динамика доходов / расходов</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              <li className="flex justify-between py-2">
                <span className="text-muted-foreground">Доходы</span>
                <span className="text-emerald-600 font-medium">
                  + {formatAmount(incomeTotal)} ₽
                </span>
              </li>
              <li className="flex justify-between py-2">
                <span className="text-muted-foreground">Расходы</span>
                <span className="text-red-600 font-medium">
                  - {formatAmount(expenseTotal)} ₽
                </span>
              </li>
              <li className="flex justify-between py-2 font-semibold">
                <span>Итог</span>
                <span
                  className={
                    incomeTotal - expenseTotal >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }
                >
                  {incomeTotal - expenseTotal >= 0 ? "+" : "-"} {" "}
                  {formatAmount(Math.abs(incomeTotal - expenseTotal))} ₽
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Экспорт отчёта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Период
              </label>
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Период</SelectLabel>
                  <SelectItem value="month">{periodLabel.month}</SelectItem>
                  <SelectItem value="quarter">
                    {periodLabel.quarter}
                  </SelectItem>
                  <SelectItem value="year">{periodLabel.year}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Формат
              </label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as Format)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Формат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Формат</SelectLabel>
                  <SelectItem value="csv">{formatLabel.csv}</SelectItem>
                  <SelectItem value="pdf">{formatLabel.pdf}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <span className="text-xs text-muted-foreground">
                Экспорт за {periodLabel[period]} в формате {formatLabel[format]}
              </span>
            </div>
            <div className="sm:col-span-1 flex items-end justify-end">
              <Button onClick={download}>
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

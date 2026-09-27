"use client";

import { useState } from "react";
import { CATEGORIES, MONTHLY_TRANSACTIONS, formatAmount } from "@/lib/data";
import PageHeader from "@/components/page-header";
import BarChart from "@/components/bar-chart";
import NoSSR from "@/components/ui/no-ssr";
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
    if (format === "csv") {
      downloadCSV();
    } else {
      downloadPDF();
    }
  };

  const downloadCSV = () => {
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

  const downloadPDF = () => {
    const periodStartDate = getPeriodStartDate(period);
    const filteredTransactions = MONTHLY_TRANSACTIONS.filter(t => new Date(t.date) >= periodStartDate);
    
    // Create HTML content for PDF
    const htmlContent = generatePDFHTML(filteredTransactions, period);
    
    // Open in new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const getPeriodStartDate = (period: Period): Date => {
    const now = new Date();
    switch (period) {
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case "year":
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  };

  const generatePDFHTML = (transactions: typeof MONTHLY_TRANSACTIONS, period: Period) => {
    const expenses = transactions.filter(t => t.type === "expense");
    const expenseTotals: Record<string, number> = {};
    expenses.forEach(t => {
      expenseTotals[t.categoryId] = (expenseTotals[t.categoryId] ?? 0) + t.amount;
    });
    const expensesByCategory = Object.entries(expenseTotals)
      .map(([categoryId, amount]) => ({ categoryId, amount }))
      .sort((a, b) => b.amount - a.amount);

    const incomeTotal = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenseTotal = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = incomeTotal - expenseTotal;

    const today = new Date().toLocaleDateString("ru-RU");

    const transactionRows = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(t => {
        const cat = CATEGORIES.find(c => c.id === t.categoryId);
        return `
          <tr>
            <td>${new Date(t.date).toLocaleDateString("ru-RU")}</td>
            <td>${t.type === "income" ? "Доход" : "Расход"}</td>
            <td>${cat?.name ?? ""}</td>
            <td style="text-align: right; color: ${t.type === "income" ? "#10b981" : "#ef4444"};">
              ${t.type === "income" ? "+" : "-"} ${formatAmount(t.amount)} ₽
            </td>
            <td>${t.description ?? ""}</td>
          </tr>
        `;
      }).join("");

    const categoryRows = expensesByCategory.map(({ categoryId, amount }) => {
      const cat = CATEGORIES.find(c => c.id === categoryId);
      return `
        <tr>
          <td>${cat?.icon ?? ""} ${cat?.name ?? ""}</td>
          <td style="text-align: right;">${formatAmount(amount)} ₽</td>
          <td style="text-align: right;">${expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0}%</td>
        </tr>
      `;
    }).join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Финансовый отчёт - ${periodLabel[period]}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #333; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
            h2 { color: #333; margin-top: 30px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .period-info { color: #666; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .summary-card.income { border-left: 4px solid #10b981; }
            .summary-card.expense { border-left: 4px solid #ef4444; }
            .summary-card.balance { border-left: 4px solid ${balance >= 0 ? "#10b981" : "#ef4444"}; }
            .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .summary-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
            .summary-value.income { color: #10b981; }
            .summary-value.expense { color: #ef4444; }
            .summary-value.balance { color: ${balance >= 0 ? "#10b981" : "#ef4444"}; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; font-weight: 600; color: #333; }
            tr:hover { background: #f8fafc; }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
            .actions { margin-top: 20px; text-align: center; }
            button { background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
            button:hover { background: #6d28d9; }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Печать / Сохранить как PDF</button>
          <div class="header">
            <h1>Финансовый отчёт</h1>
            <div class="period-info">
              <p>Период: ${periodLabel[period]}</p>
              <p>Сформирован: ${today}</p>
            </div>
          </div>
          
          <div class="summary">
            <div class="summary-card income">
              <div class="summary-label">Доходы</div>
              <div class="summary-value income">+ ${formatAmount(incomeTotal)} ₽</div>
            </div>
            <div class="summary-card expense">
              <div class="summary-label">Расходы</div>
              <div class="summary-value expense">- ${formatAmount(expenseTotal)} ₽</div>
            </div>
            <div class="summary-card balance">
              <div class="summary-label">Баланс</div>
              <div class="summary-value balance">${balance >= 0 ? "+" : "-"} ${formatAmount(Math.abs(balance))} ₽</div>
            </div>
          </div>

          <h2>Расходы по категориям</h2>
          <table>
            <thead>
              <tr>
                <th>Категория</th>
                <th style="text-align: right;">Сумма</th>
                <th style="text-align: right;">Доля</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows}
              <tr style="font-weight: bold; border-top: 2px solid #e2e8f0;">
                <td>Всего</td>
                <td style="text-align: right;">${formatAmount(expenseTotal)} ₽</td>
                <td style="text-align: right;">100%</td>
              </tr>
            </tbody>
          </table>

          <h2>Детальный список операций</h2>
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Категория</th>
                <th style="text-align: right;">Сумма</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
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
              <NoSSR
                fallback={
                  <div className="h-10 w-full rounded-md border border-input bg-muted" />
                }
              >
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
              </NoSSR>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Формат
              </label>
              <NoSSR
                fallback={
                  <div className="h-10 w-full rounded-md border border-input bg-muted" />
                }
              >
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
              </NoSSR>
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

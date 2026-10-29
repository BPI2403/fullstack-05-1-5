import type { Category } from "@/entities/category/model/types";
import type { Transaction } from "@/entities/transaction/model/types";
import {
  formatAmount,
  formatDateFull,
} from "@/shared/lib/format";
import { getExpensesByCategory, getTotals } from "@/entities/finance/model/selectors";
import { PERIOD_LABELS, type Period } from "./period";

/** HTML-версия отчёта для печати / «Сохранить как PDF». */
export function openPrintReport(
  transactions: Transaction[],
  categories: Category[],
  period: Period,
): void {
  const totals = getTotals(transactions);
  const expensesByCategory = getExpensesByCategory(transactions);

  const today = new Date().toLocaleDateString("ru-RU");
  const periodLabel = PERIOD_LABELS[period];

  const transactionRows = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((t) => {
      const category = categories.find((c) => c.id === t.categoryId);
      const positive = t.type === "income";
      return `
        <tr>
          <td>${formatDateFull(t.date)}</td>
          <td>${positive ? "Доход" : "Расход"}</td>
          <td>${category?.name ?? ""}</td>
          <td style="text-align: right; color: ${
            positive ? "#10b981" : "#ef4444"
          };">
            ${positive ? "+" : "-"} ${formatAmount(t.amount)} ₽
          </td>
          <td>${t.description ?? ""}</td>
        </tr>
      `;
    })
    .join("");

  const categoryRows = expensesByCategory
    .map(({ categoryId, amount }) => {
      const category = categories.find((c) => c.id === categoryId);
      const share =
        totals.expense > 0 ? Math.round((amount / totals.expense) * 100) : 0;
      return `
        <tr>
          <td>${category?.icon ?? ""} ${category?.name ?? ""}</td>
          <td style="text-align: right;">${formatAmount(amount)} ₽</td>
          <td style="text-align: right;">${share}%</td>
        </tr>
      `;
    })
    .join("");

  const balanceColor = totals.balance >= 0 ? "#10b981" : "#ef4444";

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Финансовый отчёт — ${periodLabel}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .period-info { color: #666; text-align: right; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .summary-card.income { border-left: 4px solid #10b981; }
          .summary-card.expense { border-left: 4px solid #ef4444; }
          .summary-card.balance { border-left: 4px solid ${balanceColor}; }
          .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          .summary-value.income { color: #10b981; }
          .summary-value.expense { color: #ef4444; }
          .summary-value.balance { color: ${balanceColor}; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; color: #333; }
          @media print { body { margin: 0; } .actions { display: none; } }
          .actions { margin-top: 20px; text-align: center; }
          .actions button { background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="actions">
          <button onclick="window.print()">Печать / Сохранить как PDF</button>
        </div>
        <div class="header">
          <h1>Финансовый отчёт</h1>
          <div class="period-info">
            <p>Период: ${periodLabel}</p>
            <p>Сформирован: ${today}</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card income">
            <div class="summary-label">Доходы</div>
            <div class="summary-value income">+ ${formatAmount(totals.income)} ₽</div>
          </div>
          <div class="summary-card expense">
            <div class="summary-label">Расходы</div>
            <div class="summary-value expense">- ${formatAmount(totals.expense)} ₽</div>
          </div>
          <div class="summary-card balance">
            <div class="summary-label">Баланс</div>
            <div class="summary-value balance">${totals.balance >= 0 ? "+" : "-"} ${formatAmount(Math.abs(totals.balance))} ₽</div>
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
              <td style="text-align: right;">${formatAmount(totals.expense)} ₽</td>
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

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

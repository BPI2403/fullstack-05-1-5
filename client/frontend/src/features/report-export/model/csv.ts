import type { Category } from "@/entities/category/model/types";
import type { Transaction } from "@/entities/transaction/model/types";
import { formatAmount, formatDateFull } from "@/shared/lib/format";

/** Сборка CSV-выгрузки операций (с BOM, чтобы Excel понял кириллицу). */
export function buildCsv(
  transactions: Transaction[],
  categories: Category[],
): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((t) => {
      const category = categories.find((c) => c.id === t.categoryId);
      return [
        escape(formatDateFull(t.date)),
        escape(t.type === "income" ? "Доход" : "Расход"),
        escape(category?.name ?? ""),
        escape(formatAmount(t.amount)),
        escape(t.description ?? ""),
      ].join(",");
    });
  return (
    "\uFEFF" +
    ["Дата,Тип,Категория,Сумма,Описание", ...rows].join("\n")
  );
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

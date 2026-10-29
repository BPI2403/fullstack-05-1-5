"use client";

import { useState } from "react";
import { Download, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import NoSSR from "@/shared/ui/no-ssr";
import { useFinanceState } from "@/entities/finance/model/store";
import { formatMonthLabel } from "@/shared/lib/format";
import { buildCsv, downloadFile } from "../model/csv";
import { openPrintReport } from "../model/pdf";
import {
  PERIOD_LABELS,
  filterByPeriod,
  type Period,
} from "../model/period";

type ExportFormat = "csv" | "pdf";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV",
  pdf: "PDF",
};

/** Карточка экспорта отчёта за выбранный период в CSV/PDF. */
export function ExportCard() {
  const { transactions, categories, currentMonth } = useFinanceState();
  const [period, setPeriod] = useState<Period>("month");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);

  const periodTransactions = filterByPeriod(
    transactions,
    period,
    currentMonth,
  );

  const download = () => {
    if (periodTransactions.length === 0 || exporting) return;
    setExporting(true);
    try {
      if (format === "csv") {
        downloadFile(
          buildCsv(periodTransactions, categories),
          `finances-${period}.csv`,
          "text/csv;charset=utf-8",
        );
      } else {
        openPrintReport(periodTransactions, categories, period);
      }
    } finally {
      // Небольшая задержка, чтобы кнопка показала процесс экспорта.
      setTimeout(() => setExporting(false), 400);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Экспорт отчёта</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
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
                  <SelectItem value="month">
                    {PERIOD_LABELS.month}
                  </SelectItem>
                  <SelectItem value="quarter">
                    {PERIOD_LABELS.quarter}
                  </SelectItem>
                  <SelectItem value="year">{PERIOD_LABELS.year}</SelectItem>
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
                onValueChange={(v) => setFormat(v as ExportFormat)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Формат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Формат</SelectLabel>
                  <SelectItem value="csv">{FORMAT_LABELS.csv}</SelectItem>
                  <SelectItem value="pdf">{FORMAT_LABELS.pdf}</SelectItem>
                </SelectContent>
              </Select>
            </NoSSR>
          </div>

          <div className="sm:col-span-2 text-xs text-muted-foreground sm:pt-2">
            {periodTransactions.length === 0
              ? "За выбранный период нет операций"
              : `Экспорт за ${formatMonthLabel(currentMonth).replace(/^./, (ch) => ch.toUpperCase())} (${
                  PERIOD_LABELS[period].toLowerCase()
                }) в формате ${FORMAT_LABELS[format]} — операций: ${
                  periodTransactions.length
                }`}
          </div>

          <div className="flex sm:justify-end">
            <Button
              onClick={download}
              disabled={periodTransactions.length === 0 || exporting}
            >
              {exporting ? (
                <FileDown className="mr-2 h-4 w-4 animate-bounce" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exporting ? "Готовим файл…" : "Скачать"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

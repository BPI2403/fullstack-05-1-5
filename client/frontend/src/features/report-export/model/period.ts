export type Period = "month" | "quarter" | "year";

export const PERIOD_LABELS: Record<Period, string> = {
  month: "Месяц",
  quarter: "Квартал",
  year: "Год",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Границы периода [от, до] в формате YYYY-MM-DD относительно месяца снапшота. */
export function getPeriodRange(
  period: Period,
  currentMonth: string,
): { from: string; to: string } {
  const [year, month] = currentMonth.split("-").map(Number);
  const lastDay = (y: number, m: number) =>
    new Date(y, m, 0).getDate();

  if (period === "month") {
    return {
      from: `${year}-${pad(month)}-01`,
      to: `${year}-${pad(month)}-${pad(lastDay(year, month))}`,
    };
  }
  if (period === "quarter") {
    const firstMonth = Math.floor((month - 1) / 3) * 3 + 1;
    const lastMonth = firstMonth + 2;
    return {
      from: `${year}-${pad(firstMonth)}-01`,
      to: `${year}-${pad(lastMonth)}-${pad(lastDay(year, lastMonth))}`,
    };
  }
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function filterByPeriod<T extends { date: string }>(
  items: T[],
  period: Period,
  currentMonth: string,
): T[] {
  const { from, to } = getPeriodRange(period, currentMonth);
  return items.filter((item) => item.date >= from && item.date <= to);
}

const currency = new Intl.NumberFormat("ru-RU");

export const formatAmount = (amount: number) => currency.format(amount);

export const formatSignedAmount = (
  type: "income" | "expense",
  amount: number,
) => `${type === "income" ? "+" : "-"} ${formatAmount(amount)} ₽`;

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });

export const formatDateFull = (date: string) =>
  new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatMonthLabel = (month: string) => {
  if (!month) return "";
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
};

import { Category } from "@/lib/types";
import { CATEGORIES_BY_ID } from "@/lib/data";
import { formatAmount } from "@/lib/data";

interface BudgetProgressProps {
  categoryId: string;
  spent: number;
  limit: number;
}

export default function BudgetProgress({
  categoryId,
  spent,
  limit,
}: BudgetProgressProps) {
  const category: Category = CATEGORIES_BY_ID[categoryId] ?? {
    id: categoryId,
    name: "—",
    type: "expense",
    icon: "📦",
    color: "#6b7280",
  };

  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = limit - spent;
  const overflow = spent > limit;

  const barColor = overflow
    ? "bg-red-500"
    : percent >= 90
      ? "bg-amber-500"
      : "bg-blue-500";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {category.name}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatAmount(spent)} / {formatAmount(limit)} ₽
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Осталось:{" "}
          <span
            className={
              remaining < 0
                ? "text-red-600 font-medium"
                : "text-gray-600 dark:text-gray-300"
            }
          >
            {formatAmount(Math.max(remaining, 0))} ₽
          </span>
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      {overflow ? (
        <span className="text-xs text-red-600">
          Превышен бюджет на {formatAmount(spent - limit)} ₽
        </span>
      ) : null}
    </div>
  );
}

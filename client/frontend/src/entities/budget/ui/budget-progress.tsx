"use client";

import type { Category } from "@/entities/category/model/types";
import { Progress } from "@/shared/ui/progress";
import { formatAmount } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

interface BudgetProgressProps {
  category: Category | undefined;
  spent: number;
  limit: number;
  className?: string;
}

/** Шкала расхода бюджета по одной категории. */
export function BudgetProgress({
  category,
  spent,
  limit,
  className,
}: BudgetProgressProps) {
  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = limit - spent;
  const overflow = spent > limit;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category?.icon ?? "📦"}</span>
          <span className="font-medium text-foreground">
            {category?.name ?? "—"}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatAmount(spent)} / {formatAmount(limit)} ₽
        </span>
      </div>
      <Progress
        value={spent}
        max={limit}
        className={cn(
          "[&>*]:bg-primary",
          overflow
            ? "[&>*]:bg-destructive"
            : percent >= 90
              ? "[&>*]:bg-amber-500"
              : "",
        )}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Осталось:{" "}
          <span
            className={
              remaining < 0
                ? "text-destructive font-medium"
                : "text-foreground"
            }
          >
            {formatAmount(Math.max(remaining, 0))} ₽
          </span>
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      {overflow ? (
        <span className="text-xs text-destructive">
          Превышен бюджет на {formatAmount(spent - limit)} ₽
        </span>
      ) : null}
    </div>
  );
}

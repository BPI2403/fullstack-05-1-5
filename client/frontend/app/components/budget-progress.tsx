import { CATEGORIES_BY_ID } from "@/lib/data";
import { Category } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  categoryId: string;
  spent: number;
  limit: number;
  className?: string;
}

export default function BudgetProgress({
  categoryId,
  spent,
  limit,
  className,
}: BudgetProgressProps) {
  const category: Category | undefined =
    CATEGORIES_BY_ID[categoryId] ?? undefined;

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
          {new Intl.NumberFormat("ru-RU").format(spent)} /{" "}
          {new Intl.NumberFormat("ru-RU").format(limit)} ₽
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
            {new Intl.NumberFormat("ru-RU").format(Math.max(remaining, 0))} ₽
          </span>
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      {overflow ? (
        <span className="text-xs text-destructive">
          Превышен бюджет на{" "}
          {new Intl.NumberFormat("ru-RU").format(spent - limit)} ₽
        </span>
      ) : null}
    </div>
  );
}

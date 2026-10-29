import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { formatAmount } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

export interface BarChartItem {
  id: string;
  label: string;
  amount: number;
  color: string;
  icon?: string;
}

interface BarChartProps {
  title: string;
  description?: string;
  data: BarChartItem[];
  /** Подсказка, когда данных для диаграммы нет. */
  emptyHint?: string;
  className?: string;
}

/** Столбчатая диаграмма без привязки к предметной области. */
export function BarChart({
  title,
  description,
  data,
  emptyHint = "Нет данных для отображения",
  className,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            {emptyHint}
          </p>
        ) : (
          <div className="flex items-end justify-between gap-2 h-56">
            {data.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col items-center flex-1"
              >
                <span className="text-xs mb-1">
                  {formatAmount(item.amount)} ₽
                </span>
                <div
                  className="w-full min-h-1 rounded-t-sm origin-bottom bar-grow"
                  style={{
                    height: `${(item.amount / max) * 100}%`,
                    backgroundColor: item.color,
                    opacity: 0.9,
                    animationDelay: `${index * 60}ms`,
                  }}
                  title={item.label}
                />
                <span
                  className="text-[10px] mt-1 text-center break-all text-muted-foreground"
                  title={item.label}
                >
                  {item.icon} {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

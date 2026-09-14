import { Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarChartProps {
  title: string;
  data: { categoryId: string; amount: number }[];
  categories: Category[];
  description?: string;
}

export default function BarChart({
  title,
  data,
  categories,
  description,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-56">
          {data.map((d, i) => {
            const category = categories.find((c) => c.id === d.categoryId);
            const height = (d.amount / max) * 100;
            return (
              <div
                key={d.categoryId + i}
                className="flex flex-col items-center flex-1"
              >
                <span className="text-xs mb-1">
                  {new Intl.NumberFormat("ru-RU").format(d.amount)} ₽
                </span>
                <div
                  className="w-full min-h-1 rounded-t-sm transition-all"
                  style={{
                    height: `${height}%`,
                    backgroundColor: category?.color ?? "#3b82f6",
                    opacity: 0.9,
                  }}
                  title={category?.name}
                />
                <span
                  className="text-[10px] mt-1 text-center break-all text-muted-foreground"
                  title={category?.name}
                >
                  {category?.icon} {category?.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

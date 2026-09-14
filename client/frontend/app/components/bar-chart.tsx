import { Category } from "@/lib/types";
import { formatAmount } from "@/lib/data";

interface BarChartProps {
  data: { categoryId: string; amount: number }[];
  categories: Category[];
}

export default function BarChart({ data, categories }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-56">
      {data.map((d, i) => {
        const category = categories.find((c) => c.id === d.categoryId);
        const height = (d.amount / max) * 100;
        return (
          <div
            key={d.categoryId + i}
            className="flex flex-col items-center flex-1"
          >
            <span className="text-xs mb-1">{formatAmount(d.amount)} ₽</span>
            <div
              className="w-full min-h-1 rounded-t transition-all"
              style={{
                height: `${height}%`,
                backgroundColor: category?.color ?? "#3b82f6",
              }}
              title={category?.name}
            />
            <span
              className="text-xs mt-1 text-center break-all"
              title={category?.name}
            >
              {category?.icon} {category?.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

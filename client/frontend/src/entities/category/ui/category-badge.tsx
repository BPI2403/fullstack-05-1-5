"use client";

import { Badge } from "@/shared/ui/badge";
import { useFinanceState } from "@/entities/finance/model/store";

interface CategoryBadgeProps {
  categoryId?: string;
  className?: string;
}

export function CategoryBadge({ categoryId, className }: CategoryBadgeProps) {
  const { categories } = useFinanceState();
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <Badge variant="outline" className={className}>
        —
      </Badge>
    );
  }

  return (
    <Badge
      variant={category.type === "income" ? "default" : "secondary"}
      className={className}
    >
      <span className="mr-1">{category.icon}</span>
      {category.name}
    </Badge>
  );
}

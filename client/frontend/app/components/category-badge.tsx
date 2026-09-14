import { CATEGORIES_BY_ID } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  categoryId?: string;
  className?: string;
}

export default function CategoryBadge({
  categoryId,
  className,
}: CategoryBadgeProps) {
  const category = categoryId ? CATEGORIES_BY_ID[categoryId] : undefined;

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

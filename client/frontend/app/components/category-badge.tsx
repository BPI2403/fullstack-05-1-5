import { CATEGORIES_BY_ID } from "@/lib/data";

interface CategoryBadgeProps {
  categoryId?: string;
}

export default function CategoryBadge({ categoryId }: CategoryBadgeProps) {
  const category = categoryId ? CATEGORIES_BY_ID[categoryId] : undefined;

  if (!category) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        —
      </span>
    );
  }

  const bg =
    category.type === "income" ? "bg-emerald-100" : "bg-red-100";
  const fg =
    category.type === "income" ? "text-emerald-800" : "text-red-800";

  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" +
        " " +
        bg +
        " " +
        fg
      }
    >
      <span>{category.icon}</span>
      {category.name}
    </span>
  );
}

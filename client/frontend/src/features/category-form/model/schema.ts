import type { Category } from "@/entities/category/model/types";
import {
  maxLength,
  minLength,
  required,
  uniqueValue,
  validateValues,
  type FieldErrors,
} from "@/shared/lib/validation";

export interface CategoryFormValues {
  name: string;
  type: Category["type"];
  icon: string;
}

export function validateCategoryForm(
  values: CategoryFormValues,
  existing: Category[],
  editingId?: string,
): FieldErrors<CategoryFormValues> {
  return validateValues<CategoryFormValues>(values, {
    name: [
      required("Укажите название категории"),
      minLength(2, "Название — минимум 2 символа"),
      maxLength(30, "Название — не длиннее 30 символов"),
      uniqueValue(
        existing,
        (c) => c.name,
        "Категория с таким названием уже есть",
        (c) => c.id === editingId,
      ),
    ],
    icon: [required("Выберите иконку")],
  });
}

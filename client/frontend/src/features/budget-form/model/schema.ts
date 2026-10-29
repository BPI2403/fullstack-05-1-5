import {
  maxDecimals,
  maxNumber,
  positiveNumber,
  required,
  validateValues,
  type FieldErrors,
} from "@/shared/lib/validation";

export interface BudgetFormValues {
  categoryId: string;
  limit: string;
}

const MAX_LIMIT = 1_000_000_000;

export function validateBudgetForm(
  values: BudgetFormValues,
): FieldErrors<BudgetFormValues> {
  return validateValues<BudgetFormValues>(values, {
    categoryId: [required("Выберите категорию")],
    limit: [
      required("Укажите лимит"),
      positiveNumber("Лимит должен быть числом больше нуля"),
      maxDecimals(2, "Не больше 2 знаков после запятой"),
      maxNumber(MAX_LIMIT, "Лимит слишком большой"),
    ],
  });
}

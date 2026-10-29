import type { TransactionInput } from "@/entities/transaction/model/types";
import {
  notFutureDate,
  maxDecimals,
  maxNumber,
  maxLength,
  positiveNumber,
  required,
  validateValues,
  type FieldErrors,
} from "@/shared/lib/validation";

export interface TransactionFormValues {
  type: TransactionInput["type"];
  amount: string;
  categoryId: string;
  date: string;
  description: string;
}

const MAX_AMOUNT = 1_000_000_000;

export function validateTransactionForm(
  values: TransactionFormValues,
): FieldErrors<TransactionFormValues> {
  return validateValues<TransactionFormValues>(values, {
    amount: [
      required("Укажите сумму"),
      positiveNumber("Сумма должна быть числом больше нуля"),
      maxDecimals(2, "Не больше 2 знаков после запятой"),
      maxNumber(MAX_AMOUNT, "Сумма слишком большая"),
    ],
    categoryId: [required("Выберите категорию")],
    date: [required("Укажите дату"), notFutureDate()],
    description: [maxLength(200, "Описание — не длиннее 200 символов")],
  });
}

export function toTransactionInput(
  values: TransactionFormValues,
): TransactionInput {
  return {
    type: values.type,
    amount: Number(values.amount.replace(",", ".")),
    categoryId: values.categoryId,
    date: values.date,
    description: values.description.trim() || undefined,
  };
}

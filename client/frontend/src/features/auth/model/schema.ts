import type { FieldErrors } from "@/shared/lib/validation";
import {
  email,
  maxLength,
  minLength,
  required,
  validateValues,
} from "@/shared/lib/validation";

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  email: string;
  password: string;
  displayName: string;
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  return validateValues<LoginValues>(values, {
    email: [required("Укажите email"), email()],
    password: [required("Укажите пароль")],
  });
}

export function validateRegister(
  values: RegisterValues,
): FieldErrors<RegisterValues> {
  return validateValues<RegisterValues>(values, {
    email: [required("Укажите email"), email()],
    password: [
      required("Укажите пароль"),
      minLength(8, "Пароль — минимум 8 символов"),
      maxLength(128, "Пароль — не длиннее 128 символов"),
    ],
  });
}

/**
 * Простая клиентская валидация: набор переиспользуемых правил-предикатов,
 * которые возвращают текст ошибки или null, и функция сборки ошибок по полям.
 */

export type Validator<V> = (value: V) => string | null;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export const required =
  (message = "Заполните поле"): Validator<string> =>
  (value) =>
    value.trim().length > 0 ? null : message;

export const minLength =
  (limit: number, message?: string): Validator<string> =>
  (value) =>
    value.trim().length >= limit
      ? null
      : message ?? `Минимум ${limit} симв.`;

export const maxLength =
  (limit: number, message?: string): Validator<string> =>
  (value) =>
    value.length <= limit ? null : message ?? `Не длиннее ${limit} симв.`;

/** Правила для строкового ввода суммы: непустое положительное число. */
export const positiveNumber =
  (message = "Введите число больше нуля"): Validator<string> =>
  (value) => {
    if (!value.trim()) return null; // пустоту ловит required
    const num = Number(value.replace(",", "."));
    return Number.isFinite(num) && num > 0 ? null : message;
  };

export const maxDecimals =
  (limit: number, message?: string): Validator<string> =>
  (value) => {
    if (!value.trim()) return null;
    const num = Number(value.replace(",", "."));
    const decimals = num.toString().split(".")[1];
    return !decimals || decimals.length <= limit
      ? null
      : message ?? `Не больше ${limit} знаков после запятой`;
  };

export const maxNumber =
  (limit: number, message?: string): Validator<string> =>
  (value) => {
    if (!value.trim()) return null;
    const num = Number(value.replace(",", "."));
    return num <= limit ? null : message ?? `Не больше ${limit}`;
  };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const email =
  (message = "Введите корректный email"): Validator<string> =>
  (value) =>
    EMAIL_PATTERN.test(value.trim()) ? null : message;

export const notFutureDate =
  (message = "Дата не может быть в будущем"): Validator<string> =>
  (value) => {
    if (!value) return null;
    return new Date(value) <= new Date() ? null : message;
  };

/** Уникальность значения среди уже существующих (без учёта регистра). */
export const uniqueValue =
  <T>(
    existing: readonly T[],
    pick: (item: T) => string,
    message: string,
    exclude?: (item: T) => boolean,
  ): Validator<string> =>
  (value) => {
    const normalized = value.trim().toLowerCase();
    return existing.some(
      (item) =>
        !(exclude?.(item) ?? false) &&
        pick(item).trim().toLowerCase() === normalized,
    )
      ? message
      : null;
  };

export function validateValues<T extends object>(
  values: T,
  rules: { [K in keyof T]?: Validator<T[K]>[] },
): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    for (const rule of rules[key] ?? []) {
      const error = rule(values[key]);
      if (error) {
        errors[key] = error;
        break;
      }
    }
  }
  return errors;
}

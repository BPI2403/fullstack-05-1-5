"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/entities/user/model/auth-store";
import { ApiError } from "@/shared/api/client";
import { validateRegister, type RegisterValues } from "../model/schema";

const initialValues: RegisterValues = {
  email: "",
  password: "",
  displayName: "",
};

/** Форма регистрации: проверка полей и понятный показ ошибки сервера. */
export function RegisterForm() {
  const { actions } = useAuth();
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterValues, string>> | null
  >(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<RegisterValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const clearError = (field: keyof RegisterValues) =>
    setErrors((prev) => (prev ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = async () => {
    const nextErrors = validateRegister(values);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await actions.register(
        values.email.trim(),
        values.password,
        values.displayName.trim() || undefined,
      );
      // Успех: гарды маршрута переведут на главный экран.
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields) {
          setErrors(error.fields as Partial<Record<keyof RegisterValues, string>>);
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError("Не удалось зарегистрироваться. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm animate-fade-in-up">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <FormField
            label="Email"
            required
            error={errors?.email}
            htmlFor="register-email"
          >
            <Input
              id="register-email"
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              value={values.email}
              aria-invalid={Boolean(errors?.email)}
              className={cn(
                errors?.email && "border-destructive focus-visible:ring-destructive",
              )}
              onChange={(e) => {
                patch({ email: e.target.value });
                clearError("email");
              }}
            />
          </FormField>

          <FormField
            label="Пароль"
            required
            error={errors?.password}
            hint="Минимум 8 символов"
            htmlFor="register-password"
          >
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={values.password}
              aria-invalid={Boolean(errors?.password)}
              className={cn(
                errors?.password && "border-destructive focus-visible:ring-destructive",
              )}
              onChange={(e) => {
                patch({ password: e.target.value });
                clearError("password");
              }}
            />
          </FormField>

          <FormField label="Имя" error={errors?.displayName} hint="Необязательно">
            <Input
              placeholder="Как к вам обращаться"
              autoComplete="name"
              value={values.displayName}
              onChange={(e) => {
                patch({ displayName: e.target.value });
                clearError("displayName");
              }}
            />
          </FormField>

          {serverError ? (
            <p role="alert" className="animate-fade-in text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Войдите
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

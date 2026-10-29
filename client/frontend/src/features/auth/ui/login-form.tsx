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
import { validateLogin, type LoginValues } from "../model/schema";

const initialValues: LoginValues = { email: "", password: "" };

/** Форма входа: проверка полей и понятный показ ошибки сервера. */
export function LoginForm() {
  const { actions } = useAuth();
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>> | null>(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<LoginValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const clearError = (field: keyof LoginValues) =>
    setErrors((prev) => (prev ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = async () => {
    const nextErrors = validateLogin(values);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await actions.login(values.email.trim(), values.password);
      // Успех: гарды маршрута переведут на главный экран.
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields) {
          setErrors(error.fields as Partial<Record<keyof LoginValues, string>>);
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError("Не удалось войти. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm animate-fade-in-up">
      <CardHeader>
        <CardTitle>Вход</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <FormField label="Email" required error={errors?.email} htmlFor="login-email">
            <Input
              id="login-email"
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
            htmlFor="login-password"
          >
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
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

          {serverError ? (
            <p role="alert" className="animate-fade-in text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Нет учётной записи?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Зарегистрируйтесь
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

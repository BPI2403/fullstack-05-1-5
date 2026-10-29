"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Не удалось загрузить данные",
  description = "Проверьте соединение и попробуйте ещё раз.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={
        "animate-fade-in flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-10 text-center " +
        (className ?? "")
      }
      role="alert"
    >
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onRetry}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      ) : null}
    </div>
  );
}

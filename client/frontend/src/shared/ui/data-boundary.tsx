import type { ReactNode } from "react";
import { Skeleton } from "./skeleton";
import { ErrorState } from "./error-state";

export type DataStatus = "idle" | "loading" | "ready" | "error";

interface DataBoundaryProps {
  status: DataStatus;
  /** Показать empty-состояние вместо children, когда данных нет. */
  isEmpty?: boolean;
  /** Повторная загрузка (кнопка «Повторить» в error-состоянии). */
  onRetry?: () => void;
  /** Скелет под конкретный экран. */
  skeleton?: ReactNode;
  /** Пустое состояние под конкретный экран. */
  empty?: ReactNode;
  /** Своё error-состояние (по умолчанию — общий ErrorState). */
  error?: ReactNode;
  children: ReactNode;
}

/**
 * Переключатель состояний экрана с данными: загрузка / ошибка / пусто / контент.
 */
export function DataBoundary({
  status,
  isEmpty = false,
  onRetry,
  skeleton,
  empty,
  error,
  children,
}: DataBoundaryProps) {
  if (status === "idle" || status === "loading") {
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  }
  if (status === "error") {
    return <>{error ?? <ErrorState onRetry={onRetry} />}</>;
  }
  if (isEmpty) {
    return <>{empty ?? null}</>;
  }
  return <>{children}</>;
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

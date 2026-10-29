"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const emptySubscribe = () => () => {};

/**
 * Рендерит детей только после монтирования на клиенте.
 * Удобно для компонентов, зависящих от браузерных API.
 */
export default function NoSSR({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  return mounted ? <>{children}</> : <>{fallback}</>;
}

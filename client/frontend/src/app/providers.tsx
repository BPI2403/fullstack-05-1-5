"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { FinanceProvider } from "@/entities/finance/model/store";

/** Глобальные провайдеры приложения: данные финансов и тултипы. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </FinanceProvider>
  );
}

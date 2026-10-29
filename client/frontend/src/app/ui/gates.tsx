"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/user/model/auth-store";
import { Skeleton } from "@/shared/ui/skeleton";

/** Пропускает только гостей; авторизованного переводит на главную. */
export function GuestOnlyGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <ScreenSkeleton />;
  }
  if (status === "authenticated") {
    return null;
  }
  return <>{children}</>;
}

/** Пропускает только авторизованных; гостя переводит на экран входа. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <ScreenSkeleton />;
  }
  return <>{children}</>;
}

function ScreenSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 flex-shrink-0 border-r border-border bg-card p-4 sm:block">
        <Skeleton className="mb-6 h-6 w-32" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

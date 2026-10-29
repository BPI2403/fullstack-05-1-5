"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";

/** Боковая навигация приложения. */
export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <span className="font-bold text-xl text-foreground">Финансист</span>
      </div>
      <ul className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className="mb-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-2.5 rounded-r-lg mx-2 transition-colors duration-200",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 h-5 w-1 rounded-full bg-primary" />
                ) : null}
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

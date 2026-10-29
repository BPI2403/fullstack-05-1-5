"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/entities/user/model/auth-store";
import { Button } from "@/shared/ui/button";

/** Боковая навигация приложения с данными пользователя и выходом. */
export function Navigation() {
  const pathname = usePathname();
  const { user, actions } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await actions.logout();
    router.replace("/login");
  };

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
      {user ? (
        <div className="border-t border-border p-4">
          <p
            className="mb-2 truncate text-sm font-medium text-foreground"
            title={user.email}
          >
            {user.display_name ?? user.email}
          </p>
          {user.display_name ? (
            <p
              className="mb-2 truncate text-xs text-muted-foreground"
              title={user.email}
            >
              {user.email}
            </p>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      ) : null}
    </nav>
  );
}

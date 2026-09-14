"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  ReceiptText,
  Tags,
  Target,
  ChartBar,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { label: "Главная", href: "/", icon: Home },
  { label: "Транзакции", href: "/transactions", icon: ReceiptText },
  { label: "Категории", href: "/categories", icon: Tags },
  { label: "Бюджеты", href: "/budgets", icon: Target },
  { label: "Отчёты", href: "/reports", icon: ChartBar },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <span className="font-bold text-xl text-foreground">Финансист</span>
      </div>
      <ul className="flex-1 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className="mb-1">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-r-lg mx-2 transition-colors",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
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

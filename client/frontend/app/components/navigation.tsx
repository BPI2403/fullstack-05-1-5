"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Главная", href: "/", icon: "🏠" },
  { label: "Транзакции", href: "/transactions", icon: "📋" },
  { label: "Категории", href: "/categories", icon: "🏷️" },
  { label: "Бюджеты", href: "/budgets", icon: "🎯" },
  { label: "Отчёты", href: "/reports", icon: "📊" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 flex-shrink-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
          Финансист
        </span>
      </div>
      <ul className="flex-1 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="mb-1">
              <Link
                href={item.href}
                className={
                  "flex items-center gap-3 px-4 py-2.5 rounded-r-lg mx-2 transition-colors" +
                  (active
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800")
                }
              >
                <span className="text-center w-5">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

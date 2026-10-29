import type { ComponentType, SVGProps } from "react";
import {
  Home,
  ReceiptText,
  Tags,
  Target,
  ChartBar,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Главная", href: "/", icon: Home },
  { label: "Транзакции", href: "/transactions", icon: ReceiptText },
  { label: "Категории", href: "/categories", icon: Tags },
  { label: "Бюджеты", href: "/budgets", icon: Target },
  { label: "Отчёты", href: "/reports", icon: ChartBar },
];

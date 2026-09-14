import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "default" | "income" | "expense" | "accent";
}

const toneClasses = {
  default: "bg-white dark:bg-gray-950",
  income: "bg-white dark:bg-gray-950",
  expense: "bg-white dark:bg-gray-950",
  accent: "bg-blue-50 dark:bg-blue-900/20",
};

const valueColor = {
  default: "text-gray-900 dark:text-gray-100",
  income: "text-emerald-600",
  expense: "text-red-600",
  accent: "text-blue-700 dark:text-blue-300",
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: StatCardProps) {
  return (
    <div
      className={
        "rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-1.5" +
        " " +
        toneClasses[tone]
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {icon ? <span className="text-xl">{icon}</span> : null}
      </div>
      <span className={`text-2xl font-semibold ${valueColor[tone]}`}>
        {value}
      </span>
    </div>
  );
}

"use client";

import PageHeader from "@/components/page-header";
import { CATEGORIES } from "@/lib/data";
import { Category as CategoryType } from "@/lib/types";
import { useState } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryType[]>(CATEGORIES);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const addCategory = () => {
    if (!name.trim()) return;
    const newCategory: CategoryType = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      type,
      icon: "📦",
      color: type === "income" ? "#10b981" : "#ef4444",
    };
    setCategories([newCategory, ...categories]);
    setName("");
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const incomes = categories.filter((c) => c.type === "income");
  const expenses = categories.filter((c) => c.type === "expense");

  return (
    <div className="p-6">
      <PageHeader
        title="Категории"
        description="Управление категориями доходов и расходов"
      />

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Добавить категорию
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <input
              type="text"
              placeholder="Название"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
            >
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              defaultValue="🍽️"
            >
              <option>🍽️</option>
              <option>🚇</option>
              <option>🎮</option>
              <option>🏠</option>
              <option>💼</option>
              <option>🎁</option>
              <option>📦</option>
            </select>
          </div>
          <button
            onClick={addCategory}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Сохранить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryList
          title="Доходы"
          items={incomes}
          onDelete={deleteCategory}
        />
        <CategoryList
          title="Расходы"
          items={expenses}
          onDelete={deleteCategory}
        />
      </div>
    </div>
  );
}

interface CategoryListProps {
  title: string;
  items: CategoryType[];
  onDelete: (id: string) => void;
}

function CategoryList({ title, items, onDelete }: CategoryListProps) {
  return (
    <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Категории не добавлены
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.icon}</span>
                <span className="font-medium">{c.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-gray-900"
                  title="Изменить"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

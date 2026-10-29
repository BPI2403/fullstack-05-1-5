export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  month: string;
}

export interface BudgetInput {
  categoryId: string;
  limit: number;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
}

/**
 * Transaction-related type definitions
 */

export interface Transaction {
  id: string;
  organizationId: string;
  clientId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  reference?: string;
  invoiceId?: string;
  attachments: string[];
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  client?: {
    id: string;
    name: string;
  };
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionCategory {
  // Income categories
  SALES = 'SALES',
  SERVICE = 'SERVICE',
  INTEREST = 'INTEREST',
  DIVIDEND = 'DIVIDEND',
  OTHER_INCOME = 'OTHER_INCOME',

  // Expense categories
  SALARY = 'SALARY',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SUPPLIES = 'SUPPLIES',
  MARKETING = 'MARKETING',
  INSURANCE = 'INSURANCE',
  TAX = 'TAX',
  PROFESSIONAL_FEES = 'PROFESSIONAL_FEES',
  TRAVEL = 'TRAVEL',
  EQUIPMENT = 'EQUIPMENT',
  SOFTWARE = 'SOFTWARE',
  OTHER_EXPENSE = 'OTHER_EXPENSE',

  // Transfer category
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  PAYPAL = 'PAYPAL',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  OTHER = 'OTHER',
}

export interface CreateTransactionData {
  clientId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency?: string;
  description: string;
  date: string;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  reference?: string;
  invoiceId?: string;
  attachments?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateTransactionData {
  type?: TransactionType;
  category?: TransactionCategory;
  amount?: number;
  currency?: string;
  description?: string;
  date?: string;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  reference?: string;
  invoiceId?: string;
  attachments?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface TransactionFilters {
  search?: string;
  clientId?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
  };
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  transactionCount: number;
  averageTransactionAmount: number;
  categoryBreakdown: Record<TransactionCategory, number>;
  monthlyTrend: {
    month: string;
    income: number;
    expense: number;
    net: number;
  }[];
}

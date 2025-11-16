/**
 * API Response wrapper for all API endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/**
 * API Error format
 */
export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
  statusCode?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'accountant' | 'viewer';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  clientId: string;
  amount: number;
  date: Date;
  category: 'income' | 'expense' | 'transfer';
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  clientId: string;
  filename: string;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface FHSScore {
  id: string;
  clientId: string;
  score: number;
  components: {
    revenueTrend: number;
    profitMargin: number;
    cashFlow: number;
    debtRatio: number;
    expenseManagement: number;
  };
  calculatedAt: Date;
}

export interface AuthContext {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Client types
export enum ClientType {
  Individual = 'individual',
  Business = 'business',
  NonProfit = 'nonprofit',
}

export enum ClientStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}

// Transaction types
export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
  Transfer = 'transfer',
}

export enum TransactionCategory {
  // Income categories
  Sales = 'sales',
  Services = 'services',
  Investment = 'investment',
  Interest = 'interest',
  Other = 'other_income',
  
  // Expense categories
  Salaries = 'salaries',
  Rent = 'rent',
  Utilities = 'utilities',
  Office = 'office_supplies',
  Marketing = 'marketing',
  Professional = 'professional_services',
  Travel = 'travel',
  Equipment = 'equipment',
  Depreciation = 'depreciation',
  Taxes = 'taxes',
  Insurance = 'insurance',
  Maintenance = 'maintenance',
  Miscellaneous = 'miscellaneous',
}

export enum PaymentMethod {
  Cash = 'cash',
  Check = 'check',
  Credit = 'credit_card',
  Bank = 'bank_transfer',
  PayPal = 'paypal',
  Stripe = 'stripe',
  Other = 'other',
}

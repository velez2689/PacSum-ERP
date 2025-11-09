/**
 * Client-related type definitions
 */

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  type: ClientType;
  status: ClientStatus;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  industry?: string;
  website?: string;
  notes?: string;
  tags: string[];
  financialHealthScore?: number;
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  lastTransactionDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  NON_PROFIT = 'NON_PROFIT',
  GOVERNMENT = 'GOVERNMENT',
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  type: ClientType;
  status?: ClientStatus;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  industry?: string;
  website?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  type?: ClientType;
  status?: ClientStatus;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  industry?: string;
  website?: string;
  notes?: string;
  tags?: string[];
}

export interface ClientFilters {
  search?: string;
  type?: ClientType;
  status?: ClientStatus;
  tags?: string[];
  industry?: string;
  minFHS?: number;
  maxFHS?: number;
  sortBy?: 'name' | 'createdAt' | 'fhs' | 'balance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

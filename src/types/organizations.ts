/**
 * Organization-related type definitions
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: OrganizationSize;
  logo?: string;
  address?: Address;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export enum OrganizationSize {
  SMALL = 'SMALL', // 1-10 employees
  MEDIUM = 'MEDIUM', // 11-50 employees
  LARGE = 'LARGE', // 51-200 employees
  ENTERPRISE = 'ENTERPRISE', // 200+ employees
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrganizationSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  defaultTaxRate: number;
  enableMultiCurrency: boolean;
  enableInvoicing: boolean;
  enablePayroll: boolean;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  permissions: string[];
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: OrganizationSize;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  industry?: string;
  size?: OrganizationSize;
  logo?: string;
  address?: Address;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings?: Partial<OrganizationSettings>;
}

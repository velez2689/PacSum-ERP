/**
 * Form validation schemas using Zod
 */

import { z } from 'zod';
import { ClientType, ClientStatus, TransactionType, TransactionCategory, PaymentMethod } from '@/types';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number')
  .optional();

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  organizationName: z.string().min(1, 'Organization name is required').max(100, 'Organization name is too long'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Client validation schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200, 'Name is too long'),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  taxId: z.string().max(50, 'Tax ID is too long').optional().or(z.literal('')),
  type: z.nativeEnum(ClientType),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.ACTIVE),
  address: z
    .object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(1, 'ZIP code is required'),
      country: z.string().min(1, 'Country is required'),
    })
    .optional(),
  contactPerson: z
    .object({
      name: z.string().min(1, 'Contact name is required'),
      email: emailSchema,
      phone: z.string().min(1, 'Contact phone is required'),
      position: z.string().max(100, 'Position is too long').optional().or(z.literal('')),
    })
    .optional(),
  industry: z.string().max(100, 'Industry is too long').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes are too long').optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
});

export const updateClientSchema = createClientSchema.partial();

// Transaction validation schemas
export const createTransactionSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().positive('Amount must be positive').max(999999999.99, 'Amount is too large'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  date: z.string().datetime('Invalid date format'),
  status: z.nativeEnum(TransactionStatus).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().max(100, 'Reference is too long').optional().or(z.literal('')),
  invoiceId: z.string().uuid('Invalid invoice ID').optional(),
  attachments: z.array(z.string().url('Invalid attachment URL')).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().omit({ clientId: true });

// Organization validation schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description is too long').optional().or(z.literal('')),
  industry: z.string().max(100, 'Industry is too long').optional().or(z.literal('')),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional().or(z.literal('')),
  industry: z.string().max(100, 'Industry is too long').optional().or(z.literal('')),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  address: z
    .object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(1, 'ZIP code is required'),
      country: z.string().min(1, 'Country is required'),
    })
    .optional(),
  taxId: z.string().max(50, 'Tax ID is too long').optional().or(z.literal('')),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Export types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>;
export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationFormData = z.infer<typeof updateOrganizationSchema>;

// Import TransactionStatus for validation
import { TransactionStatus } from '@/types/transactions';

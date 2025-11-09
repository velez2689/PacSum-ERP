/**
 * Authentication-related type definitions
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  avatar?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  USER = 'USER',
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  token: string;
  newPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
  refreshSession: () => Promise<void>;
}

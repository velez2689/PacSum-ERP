/**
 * Authentication hook
 * Provides access to auth context
 */

import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
import type { AuthContextType } from '@/types/auth';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

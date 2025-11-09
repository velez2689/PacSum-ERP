'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

/**
 * Dashboard layout wrapper
 * Provides protected routing and main layout
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true}>
      <MainLayout showSidebar={true}>{children}</MainLayout>
    </ProtectedRoute>
  );
}

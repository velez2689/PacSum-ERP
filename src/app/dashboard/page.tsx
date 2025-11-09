'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/hooks/useOrganization';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Dashboard home page - redirects to org dashboard
 */
export default function DashboardPage() {
  const router = useRouter();
  const { currentOrgId, isLoading } = useOrganization();

  useEffect(() => {
    if (!isLoading && currentOrgId) {
      router.push(`/dashboard/${currentOrgId}`);
    }
  }, [currentOrgId, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" text="Loading organization..." />
      </div>
    );
  }

  if (!currentOrgId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-white mb-4">No Organization Found</h2>
        <p className="text-slate-400">Please create or join an organization to continue.</p>
      </div>
    );
  }

  return null;
}

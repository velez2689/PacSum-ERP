'use client';

import { Overview } from '@/components/dashboard/Overview';

/**
 * Organization overview/dashboard page
 */
export default function OrgDashboardPage({ params }: { params: { orgId: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here's your overview.</p>
        </div>
      </div>

      <Overview orgId={params.orgId} />
    </div>
  );
}

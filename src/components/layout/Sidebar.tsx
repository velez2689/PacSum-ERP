'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  FolderOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useOrganization } from '@/hooks/useOrganization';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

/**
 * Left sidebar navigation component
 */
export function Sidebar() {
  const pathname = usePathname();
  const { currentOrgId } = useOrganization();

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: `/dashboard/${currentOrgId}`,
      icon: LayoutDashboard,
    },
    {
      label: 'Clients',
      href: `/dashboard/${currentOrgId}/clients`,
      icon: Users,
    },
    {
      label: 'Transactions',
      href: `/dashboard/${currentOrgId}/transactions`,
      icon: CreditCard,
    },
    {
      label: 'Documents',
      href: `/dashboard/${currentOrgId}/documents`,
      icon: FolderOpen,
    },
    {
      label: 'Reports',
      href: `/dashboard/${currentOrgId}/reporting`,
      icon: BarChart3,
    },
    {
      label: 'Settings',
      href: `/dashboard/${currentOrgId}/settings`,
      icon: Settings,
    },
  ];

  if (!currentOrgId) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-slate-900 border-r border-slate-700 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Need help?</p>
          <Link
            href="/support"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </aside>
  );
}

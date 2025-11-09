import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication - PACSUM ERP',
  description: 'Sign in or create your PACSUM ERP account',
};

/**
 * Auth layout component
 * Provides consistent layout for all authentication pages
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container-custom py-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold text-white">PACSUM</span>
            <span className="text-sm text-slate-400">ERP</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm py-6">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>&copy; 2024 PACSUM ERP. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">
                Terms of Service
              </Link>
              <Link href="/support" className="hover:text-slate-300 transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

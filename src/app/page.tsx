'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Landing page component
 * Redirects authenticated users to dashboard
 * Shows marketing content for unauthenticated users
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">PACSUM</span>
              <span className="ml-2 text-sm text-slate-400">ERP</span>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Financial Management
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Simplified
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              PACSUM ERP is your all-in-one solution for accounting, client management,
              and financial health tracking. Built for modern businesses.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button variant="primary" size="lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📊"
              title="Financial Health Score"
              description="Track your clients' financial health with our proprietary FHS algorithm"
            />
            <FeatureCard
              icon="👥"
              title="Client Management"
              description="Manage all your clients in one place with detailed profiles and history"
            />
            <FeatureCard
              icon="📄"
              title="Document Management"
              description="Secure document storage and organization for all financial records"
            />
            <FeatureCard
              icon="💰"
              title="Transaction Tracking"
              description="Record and categorize transactions with ease and accuracy"
            />
            <FeatureCard
              icon="📈"
              title="Advanced Reporting"
              description="Generate comprehensive reports and insights for better decision making"
            />
            <FeatureCard
              icon="🔒"
              title="Bank-Level Security"
              description="Your data is protected with enterprise-grade encryption and security"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 PACSUM ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Feature card component for landing page
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 hover:border-blue-500/50 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

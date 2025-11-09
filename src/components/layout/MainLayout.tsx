'use client';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

/**
 * Main application layout wrapper
 */
export function MainLayout({ children, showSidebar = true, showFooter = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="flex pt-16">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'ml-64' : ''}`}>
          <div className="p-6">{children}</div>
          {showFooter && <Footer />}
        </main>
      </div>
    </div>
  );
}

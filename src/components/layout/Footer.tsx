import Link from 'next/link';

/**
 * Footer component
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700 bg-slate-900/50 py-8 mt-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <h3 className="text-white font-semibold mb-3">PACSUM ERP</h3>
            <p className="text-sm text-slate-400">
              Professional accounting and financial management platform for modern businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-medium mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm text-slate-400 hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-400 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-slate-400 hover:text-white">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-medium mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-slate-400 hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-400 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-sm text-slate-400 hover:text-white">
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-medium mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-slate-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-400 hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-slate-400 hover:text-white">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            &copy; {currentYear} PACSUM ERP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

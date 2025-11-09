import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NotFoundProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

/**
 * 404 Not Found component
 */
export function NotFound({
  title = 'Page Not Found',
  description = "The page you're looking for doesn't exist or has been moved.",
  showHomeButton = true,
}: NotFoundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-500">404</h1>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-slate-400 mb-8">{description}</p>
        {showHomeButton && (
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

/**
 * 404 Not Found page
 * Displays when a route is not found in the application
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* 404 Icon/Text */}
        <div className="space-y-2">
          <div className="text-6xl font-bold text-primary">404</div>
          <h1 className="text-3xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Search Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            asChild
            className="flex-1"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

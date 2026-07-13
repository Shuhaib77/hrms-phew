import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-text mb-4">404</h1>
        <p className="text-lg text-text-secondary mb-2">Page not found</p>
        <p className="text-sm text-text-tertiary mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

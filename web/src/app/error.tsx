'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || 'The list of objects could not be loaded.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

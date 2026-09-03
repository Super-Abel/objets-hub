import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/i18n/server';

export default function ObjectNotFound() {
  const t = getDictionary();

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-lg font-semibold">{t.notFound.title}</h1>
      <p className="text-sm text-muted-foreground">{t.notFound.description}</p>
      <Button asChild size="sm">
        <Link href="/">{t.notFound.back}</Link>
      </Button>
    </div>
  );
}

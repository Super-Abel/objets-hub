import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getDictionary, getLocale } from '@/i18n/server';
import { getObject } from '@/features/objects/api';

export const dynamic = 'force-dynamic';

export default async function ObjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const object = await getObject(params.id);
  if (!object) notFound();

  const t = getDictionary();
  const locale = getLocale();

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/">{t.detail.back}</Link>
      </Button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={object.imageUrl}
        alt={object.title}
        className="w-full rounded-lg border object-cover"
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{object.title}</h1>
        <p className="text-xs text-muted-foreground">
          {t.detail.created(new Date(object.createdAt).toLocaleString(locale))}
        </p>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {object.description}
      </p>
    </article>
  );
}

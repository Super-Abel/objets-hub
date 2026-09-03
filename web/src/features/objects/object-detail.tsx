'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';
import { getSocket } from '@/lib/socket';
import type { CollectionObject } from '@/lib/types';
import { ObjectEditDialog } from './object-edit-dialog';

/**
 * Client view of a single object: server-rendered snapshot seeds it, then
 * Socket.IO keeps it live — `object:updated` swaps the data in place,
 * `object:deleted` flips it to a "removed" state with a link back to the list.
 */
export function ObjectDetail({ initial }: { initial: CollectionObject }) {
  const { locale, t } = useI18n();
  const [object, setObject] = useState<CollectionObject | null>(initial);

  useEffect(() => {
    const socket = getSocket();

    const onUpdated = (next: CollectionObject) => {
      if (next.id === initial.id) setObject(next);
    };
    const onDeleted = ({ id }: { id: string }) => {
      if (id === initial.id) setObject(null);
    };

    socket.on('object:updated', onUpdated);
    socket.on('object:deleted', onDeleted);
    return () => {
      socket.off('object:updated', onUpdated);
      socket.off('object:deleted', onDeleted);
    };
  }, [initial.id]);

  if (!object) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          <PackageX className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold">{t.notFound.title}</h1>
        <p className="text-sm text-muted-foreground">{t.notFound.description}</p>
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            {t.notFound.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            {t.detail.back}
          </Link>
        </Button>
        <ObjectEditDialog object={object} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-secondary shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={object.imageUrl}
          alt={object.title}
          className="max-h-[65vh] w-full object-contain"
        />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{object.title}</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {t.detail.created(new Date(object.createdAt).toLocaleString(locale))}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground/90">
        {object.description}
      </p>
    </article>
  );
}

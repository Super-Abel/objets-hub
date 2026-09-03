'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
        <p className="text-sm text-muted-foreground">{t.notFound.description}</p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">{t.notFound.back}</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">{t.detail.back}</Link>
        </Button>
        <ObjectEditDialog object={object} />
      </div>

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

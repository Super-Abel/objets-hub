'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import type { CollectionObject } from '@/lib/types';
import { formatRelativeTime } from '@/lib/relative-time';
import { useI18n } from '@/i18n/provider';
import { ObjectEditDialog } from './object-edit-dialog';

interface ObjectCardProps {
  object: CollectionObject;
  /** Optimistically removes the row and rolls back if the API call fails. */
  onDelete: (id: string) => Promise<void>;
}

export function ObjectCard({ object, onDelete }: ObjectCardProps) {
  const { locale, t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(object.id);
    } catch (error) {
      toast.error((error as Error).message);
      setDeleting(false); // row was rolled back; let the user retry
    }
  }

  const created = new Date(object.createdAt);

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card-hover">
      <Link
        href={`/objects/${object.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={object.imageUrl}
          alt={object.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <time
          dateTime={created.toISOString()}
          title={created.toLocaleString(locale)}
          className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm"
        >
          {formatRelativeTime(created, locale)}
        </time>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1 space-y-1.5">
          <h3 className="line-clamp-1 font-semibold leading-tight tracking-tight">
            <Link
              href={`/objects/${object.id}`}
              className="transition-colors hover:text-brand"
            >
              {object.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {object.description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
          <ObjectEditDialog object={object} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? t.card.deleting : t.card.delete}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.card.deleteConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.card.deleteConfirmDescription(object.title)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  {t.card.deleteConfirmCancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault(); // keep the dialog logic ours, not auto-close race
                    void handleDelete();
                  }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? t.card.deleting : t.card.deleteConfirmAction}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

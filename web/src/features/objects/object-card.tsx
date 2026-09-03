'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CollectionObject } from '@/lib/types';
import { useI18n } from '@/i18n/provider';

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

  return (
    <Card className="overflow-hidden">
      <Link href={`/objects/${object.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={object.imageUrl}
          alt={object.title}
          className="h-44 w-full object-cover"
        />
      </Link>
      <CardHeader className="pb-2">
        <CardTitle className="truncate">
          <Link href={`/objects/${object.id}`}>{object.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {object.description}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(object.createdAt).toLocaleString(locale)}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
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
              >
                {deleting ? t.card.deleting : t.card.deleteConfirmAction}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

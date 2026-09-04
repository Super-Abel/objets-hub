'use client';

import { Loader2, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CollectionObject } from '@/lib/types';
import { useDictionary } from '@/i18n/provider';
import { ObjectCard } from './object-card';
import { ObjectForm } from './object-form';
import { useObjects } from './use-objects';

/** Client island: creation form on the left, realtime grid on the right. */
export function ObjectsBoard({ initial }: { initial: CollectionObject[] }) {
  const t = useDictionary();
  const { objects, removeObject, connected, loadMore, loadingMore, hasMore } =
    useObjects(initial);

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <ObjectForm />
      </div>

      <section className="min-w-0">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {t.board.count(objects.length)}
          </h2>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              connected
                ? 'bg-brand-muted text-brand'
                : 'bg-secondary text-muted-foreground',
            )}
            title={connected ? t.board.live : t.board.offline}
          >
            <span className="relative flex h-1.5 w-1.5">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-1.5 w-1.5 rounded-full',
                  connected ? 'bg-brand' : 'bg-muted-foreground',
                )}
              />
            </span>
            {connected ? t.board.live : t.board.offline}
          </span>
        </div>

        {objects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
              <PackageOpen className="h-6 w-6" />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t.board.empty}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {objects.map((object, i) => (
                <div
                  key={object.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <ObjectCard object={object} onDelete={removeObject} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {loadingMore ? t.board.loadingMore : t.board.loadMore}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

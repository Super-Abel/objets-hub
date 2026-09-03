'use client';

import { PackageOpen } from 'lucide-react';
import type { CollectionObject } from '@/lib/types';
import { useDictionary } from '@/i18n/provider';
import { ObjectCard } from './object-card';
import { ObjectForm } from './object-form';
import { useObjects } from './use-objects';

/** Client island: creation form on the left, realtime grid on the right. */
export function ObjectsBoard({ initial }: { initial: CollectionObject[] }) {
  const t = useDictionary();
  const { objects, removeObject } = useObjects(initial);

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            {t.board.live}
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
        )}
      </section>
    </div>
  );
}

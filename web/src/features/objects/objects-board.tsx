'use client';

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
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <div className="md:sticky md:top-6 md:self-start">
        <ObjectForm />
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          {t.board.count(objects.length)}
        </h2>
        {objects.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.board.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {objects.map((object) => (
              <ObjectCard
                key={object.id}
                object={object}
                onDelete={removeObject}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

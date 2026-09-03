import { ObjectsBoard } from '@/features/objects/objects-board';
import { listObjects } from '@/features/objects/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initial = [] as Awaited<ReturnType<typeof listObjects>>;
  try {
    initial = await listObjects();
  } catch {
    // API unreachable at build/first paint — the board still mounts and will
    // fill in as `object:created` events arrive.
  }

  return <ObjectsBoard initial={initial} />;
}

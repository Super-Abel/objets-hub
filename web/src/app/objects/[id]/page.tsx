import { notFound } from 'next/navigation';
import { getObject } from '@/features/objects/api';
import { ObjectDetail } from '@/features/objects/object-detail';

export const dynamic = 'force-dynamic';

export default async function ObjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const object = await getObject(params.id);
  if (!object) notFound();

  return <ObjectDetail initial={object} />;
}

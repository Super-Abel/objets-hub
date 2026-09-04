import { API_URL } from '@/lib/config';
import type { CollectionObject } from '@/lib/types';

const BASE = `${API_URL}/objects`;

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** GET /objects?limit=&skip= — a bounded, newest-first window over the collection. */
export async function listObjects(params?: {
  limit?: number;
  skip?: number;
}): Promise<CollectionObject[]> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.skip != null) qs.set('skip', String(params.skip));
  const query = qs.toString();
  return parse(
    await fetch(query ? `${BASE}?${query}` : BASE, { cache: 'no-store' }),
  );
}

/** GET /objects/:id — returns null on 404 so pages can call `notFound()`. */
export async function getObject(id: string): Promise<CollectionObject | null> {
  const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  return parse(res);
}

/** POST /objects — multipart (title, description, image). */
export async function createObject(input: {
  title: string;
  description: string;
  image: File;
}): Promise<CollectionObject> {
  const form = new FormData();
  form.append('title', input.title);
  form.append('description', input.description);
  form.append('image', input.image);
  return parse(await fetch(BASE, { method: 'POST', body: form }));
}

/**
 * PATCH /objects/:id — multipart. Sends only the fields provided; an `image`
 * (when set) replaces the stored one. The updated card is reconciled via the
 * `object:updated` socket event.
 */
export async function updateObject(
  id: string,
  input: { title?: string; description?: string; image?: File | null },
): Promise<CollectionObject> {
  const form = new FormData();
  if (input.title !== undefined) form.append('title', input.title);
  if (input.description !== undefined) form.append('description', input.description);
  if (input.image) form.append('image', input.image);
  return parse(
    await fetch(`${BASE}/${id}`, { method: 'PATCH', body: form }),
  );
}

/** DELETE /objects/:id */
export async function deleteObject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed (${res.status})`);
  }
}

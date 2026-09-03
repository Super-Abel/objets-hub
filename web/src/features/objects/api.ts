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

/** GET /objects — used for SSR of the list page. */
export async function listObjects(): Promise<CollectionObject[]> {
  return parse(await fetch(BASE, { cache: 'no-store' }));
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

/** DELETE /objects/:id */
export async function deleteObject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed (${res.status})`);
  }
}

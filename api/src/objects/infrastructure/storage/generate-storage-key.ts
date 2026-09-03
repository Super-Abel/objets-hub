import { randomUUID } from 'crypto';

/**
 * Builds a collision-free storage key `<prefix>/<uuid>.<ext>`. Ported from
 * OBJETS-HUB's `generateFileStorageKey`: the original name only contributes its
 * extension, never a path segment.
 */
export function generateImageStorageKey(
  originalName: string,
  prefix = 'objects',
): string {
  const extension = originalName.split('.').pop()?.toLowerCase();
  const randomId = randomUUID().replace(/-/g, '');
  const normalizedPrefix = prefix
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');

  const hasUsableExtension =
    !!extension && extension.length > 0 && extension !== originalName;
  const keyBase = hasUsableExtension ? `${randomId}.${extension}` : randomId;

  return normalizedPrefix ? `${normalizedPrefix}/${keyBase}` : keyBase;
}

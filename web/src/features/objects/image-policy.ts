/**
 * Client-side mirror of the API's `domain/image-policy.ts`. Same rules, enforced
 * before upload so the user gets immediate feedback instead of a 413/415 round
 * trip. The API stays the source of truth and re-checks everything.
 *
 * `checkImage` returns a *code*, not a message — the UI layer maps it to a
 * translated string (see `src/i18n/dictionaries`).
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** Keep in sync with `S3_MAX_IMAGE_BYTES` (API default: 5 MiB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** `MAX_IMAGE_BYTES` expressed in whole megabytes, for display. */
export const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

export type ImageProblem = 'unsupported-type' | 'too-large';

/** `null` when the file satisfies the policy, otherwise the reason it does not. */
export function checkImage(file: File): ImageProblem | null {
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'unsupported-type';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'too-large';
  }
  return null;
}

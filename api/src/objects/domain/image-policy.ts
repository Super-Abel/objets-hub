import {
  ImageRequiredError,
  ImageTooLargeError,
  MalformedImageError,
  UnsupportedImageTypeError,
} from './errors';

/** Business rule: which image formats an Object may carry. A pure domain rule. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export interface ImageCandidate {
  mimeType: string;
  size: number;
}

/**
 * Framework-free gate every image crosses before it reaches storage. Mirrors
 * OBJETS-HUB's `assertAllowedMimeType` / `assertAllowedSize` pair.
 */
export function assertAcceptableImage<T extends ImageCandidate>(
  image: T | undefined,
  maxBytes: number,
): asserts image is T {
  if (!image) throw new ImageRequiredError();
  if (
    !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(image.mimeType)
  ) {
    throw new UnsupportedImageTypeError(image.mimeType, ALLOWED_IMAGE_MIME_TYPES);
  }
  if (image.size > maxBytes) throw new ImageTooLargeError(maxBytes);
}

/**
 * Reads the leading "magic bytes" and returns the image type they actually
 * encode, or `null` if the bytes are not a recognised image. Lets the caller
 * catch a payload whose real content contradicts its declared `Content-Type`
 * (e.g. an executable sent as `image/png`).
 */
export function sniffImageMime(bytes: Uint8Array): AllowedImageMimeType | null {
  const at = (i: number) => bytes[i];
  const startsWith = (...sig: number[]) => sig.every((b, i) => at(i) === b);

  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
    return 'image/png';
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return 'image/gif'; // GIF8
  // RIFF....WEBP
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    at(8) === 0x57 &&
    at(9) === 0x45 &&
    at(10) === 0x42 &&
    at(11) === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/** Throws unless the buffer's bytes are a recognised image format. */
export function assertRealImage(bytes: Uint8Array): void {
  if (!sniffImageMime(bytes)) throw new MalformedImageError();
}

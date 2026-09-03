import {
  ALLOWED_IMAGE_MIME_TYPES,
  assertAcceptableImage,
  assertRealImage,
  sniffImageMime,
} from './image-policy';
import {
  ImageRequiredError,
  ImageTooLargeError,
  MalformedImageError,
  UnsupportedImageTypeError,
} from './errors';

const MAX_BYTES = 5 * 1024 * 1024;

describe('assertAcceptableImage', () => {
  it('throws ImageRequiredError when no image is present', () => {
    expect(() => assertAcceptableImage(undefined, MAX_BYTES)).toThrow(
      ImageRequiredError,
    );
  });

  it.each(ALLOWED_IMAGE_MIME_TYPES)('accepts %s', (mimeType) => {
    expect(() =>
      assertAcceptableImage({ mimeType, size: 1024 }, MAX_BYTES),
    ).not.toThrow();
  });

  it('rejects an unsupported MIME type', () => {
    expect(() =>
      assertAcceptableImage(
        { mimeType: 'application/pdf', size: 1024 },
        MAX_BYTES,
      ),
    ).toThrow(UnsupportedImageTypeError);
  });

  it('rejects an image larger than the byte budget', () => {
    expect(() =>
      assertAcceptableImage(
        { mimeType: 'image/png', size: MAX_BYTES + 1 },
        MAX_BYTES,
      ),
    ).toThrow(ImageTooLargeError);
  });

  it('accepts an image of exactly the byte budget', () => {
    expect(() =>
      assertAcceptableImage(
        { mimeType: 'image/png', size: MAX_BYTES },
        MAX_BYTES,
      ),
    ).not.toThrow();
  });

  it('narrows the type so the caller can use the image afterwards', () => {
    const candidate: { mimeType: string; size: number } | undefined = {
      mimeType: 'image/webp',
      size: 10,
    };
    assertAcceptableImage(candidate, MAX_BYTES);
    // If this compiles, the `asserts image is T` narrowing worked.
    expect(candidate.mimeType).toBe('image/webp');
  });
});

describe('sniffImageMime', () => {
  const cases: Array<[string, number[], string | null]> = [
    ['PNG', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'image/png'],
    ['JPEG', [0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
    ['GIF', [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 'image/gif'],
    [
      'WEBP',
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
      'image/webp',
    ],
    ['garbage', [0x00, 0x01, 0x02, 0x03], null],
  ];

  it.each(cases)('detects %s', (_label, bytes, expected) => {
    expect(sniffImageMime(Uint8Array.from(bytes))).toBe(expected);
  });

  it('assertRealImage throws MalformedImageError on non-image bytes', () => {
    expect(() => assertRealImage(Uint8Array.from([1, 2, 3, 4]))).toThrow(
      MalformedImageError,
    );
  });
});

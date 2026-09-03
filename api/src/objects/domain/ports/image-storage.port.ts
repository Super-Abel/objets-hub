/** DI token for the image storage port. */
export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface ImageToUpload {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  size: number;
}

export interface StoredImage {
  key: string;
  url: string;
}

/** Driven port: an S3-compatible object store. */
export interface ImageStorage {
  upload(image: ImageToUpload): Promise<StoredImage>;
  delete(key: string): Promise<void>;
}

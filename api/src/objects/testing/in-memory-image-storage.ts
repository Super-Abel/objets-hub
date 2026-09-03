import { randomUUID } from 'crypto';
import {
  ImageStorage,
  ImageToUpload,
  StoredImage,
} from '../domain/ports/image-storage.port';

/**
 * In-memory {@link ImageStorage}. Records every upload and delete so tests can
 * assert the rollback behaviour of `CreateObjectUseCase` without touching S3.
 */
export class InMemoryImageStorage implements ImageStorage {
  readonly uploads: ImageToUpload[] = [];
  readonly deleted: string[] = [];
  private readonly keys = new Set<string>();

  async upload(image: ImageToUpload): Promise<StoredImage> {
    this.uploads.push(image);
    const key = `objects/${randomUUID().replace(/-/g, '')}.bin`;
    this.keys.add(key);
    return { key, url: `http://cdn.test/${key}` };
  }

  async delete(key: string): Promise<void> {
    // Best-effort: never throws on a missing key (matches the port contract).
    this.deleted.push(key);
    this.keys.delete(key);
  }

  /** Test helper: keys currently held. */
  get liveKeys(): string[] {
    return [...this.keys];
  }
}

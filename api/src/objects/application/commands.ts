import { ImageToUpload } from '../domain/ports/image-storage.port';

/** Input of the "create object" use case, expressed without any framework type. */
export interface CreateObjectCommand {
  title: string;
  description: string;
  image?: ImageToUpload;
}

/**
 * Input of the "update object" use case. `title` / `description` are applied
 * only when present; `image`, when present, replaces the stored one.
 */
export interface UpdateObjectCommand {
  id: string;
  title?: string;
  description?: string;
  image?: ImageToUpload;
}

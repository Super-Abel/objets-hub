import { ImageToUpload } from '../domain/ports/image-storage.port';

/** Input of the "create object" use case, expressed without any framework type. */
export interface CreateObjectCommand {
  title: string;
  description: string;
  image?: ImageToUpload;
}

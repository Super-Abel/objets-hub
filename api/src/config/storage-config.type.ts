/** Typed view of the object-storage configuration (mirrors OBJETS-HUB `FileConfig`). */
export type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  /** Public base URL used to build the persisted `imageUrl`. */
  publicUrl: string;
  /** MinIO and most non-AWS S3 gateways require path-style addressing. */
  forcePathStyle: boolean;
  /** Hard upper bound enforced by multer and re-checked in the use case. */
  maxImageBytes: number;
  /** Prefix under which every object image is stored. */
  keyPrefix: string;
};

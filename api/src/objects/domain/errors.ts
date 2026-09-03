/** Stable, machine-readable identifiers returned to clients as `code`. */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OBJECT_NOT_FOUND = 'OBJECT_NOT_FOUND',
  IMAGE_REQUIRED = 'IMAGE_REQUIRED',
  IMAGE_UNSUPPORTED_TYPE = 'IMAGE_UNSUPPORTED_TYPE',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  IMAGE_CONTENT_MISMATCH = 'IMAGE_CONTENT_MISMATCH',
}

/** Base class for every violation of a domain rule. Mapped to HTTP 400 by default. */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: ErrorCode = ErrorCode.VALIDATION_ERROR,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Raised when an object referenced by id does not exist. Mapped to HTTP 404. */
export class ObjectNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Object "${id}" was not found`, ErrorCode.OBJECT_NOT_FOUND);
  }
}

/** No image part was present in the multipart request. */
export class ImageRequiredError extends DomainError {
  constructor() {
    super('an image file is required', ErrorCode.IMAGE_REQUIRED);
  }
}

/** The uploaded part is not an accepted image MIME type. Mapped to HTTP 415. */
export class UnsupportedImageTypeError extends DomainError {
  constructor(mimeType: string, allowed: readonly string[]) {
    super(
      `image type "${mimeType}" is not supported (allowed: ${allowed.join(', ')})`,
      ErrorCode.IMAGE_UNSUPPORTED_TYPE,
    );
  }
}

/** The uploaded image exceeds the configured size budget. Mapped to HTTP 413. */
export class ImageTooLargeError extends DomainError {
  constructor(maxBytes: number) {
    super(
      `image exceeds the maximum size of ${maxBytes} bytes`,
      ErrorCode.IMAGE_TOO_LARGE,
    );
  }
}

/**
 * The file's bytes don't match any accepted image format — a spoofed
 * `Content-Type` or a corrupt upload. Mapped to HTTP 415.
 */
export class MalformedImageError extends DomainError {
  constructor() {
    super(
      'the uploaded file is not a valid image',
      ErrorCode.IMAGE_CONTENT_MISMATCH,
    );
  }
}

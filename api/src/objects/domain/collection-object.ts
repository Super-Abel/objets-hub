import { DomainError } from './errors';

export interface CollectionObjectProps {
  id: string | null;
  title: string;
  description: string;
  imageUrl: string;
  imageKey: string;
  createdAt: Date | null;
}

export interface NewCollectionObject {
  title: string;
  description: string;
  imageUrl: string;
  imageKey: string;
}

/** Partial change applied to a persisted object — every field is optional. */
export interface CollectionObjectChanges {
  title?: string;
  description?: string;
  imageUrl?: string;
  imageKey?: string;
}

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;

/** The invariants of a valid object — shared by `create` and `withChanges`. */
function assertInvariants(fields: {
  title: string;
  description: string;
  imageUrl: string;
  imageKey: string;
}): void {
  if (!fields.title) throw new DomainError('title is required');
  if (fields.title.length > MAX_TITLE)
    throw new DomainError(`title must be at most ${MAX_TITLE} characters`);
  if (!fields.description) throw new DomainError('description is required');
  if (fields.description.length > MAX_DESCRIPTION)
    throw new DomainError(
      `description must be at most ${MAX_DESCRIPTION} characters`,
    );
  if (!fields.imageUrl || !fields.imageKey)
    throw new DomainError('a stored image is required');
}

/**
 * Aggregate root of the "Objects" collection. Framework-free: it knows nothing
 * about Mongo, HTTP or S3 — only the invariants of a valid object.
 */
export class CollectionObject {
  private constructor(private readonly props: CollectionObjectProps) {}

  /** Build a brand-new object (not yet persisted, hence id/createdAt are null). */
  static create(input: NewCollectionObject): CollectionObject {
    const title = input.title?.trim() ?? '';
    const description = input.description?.trim() ?? '';

    assertInvariants({
      title,
      description,
      imageUrl: input.imageUrl,
      imageKey: input.imageKey,
    });

    return new CollectionObject({
      id: null,
      title,
      description,
      imageUrl: input.imageUrl,
      imageKey: input.imageKey,
      createdAt: null,
    });
  }

  /** Rebuild an object from a persisted representation (trusted, no validation). */
  static rehydrate(props: CollectionObjectProps): CollectionObject {
    return new CollectionObject(props);
  }

  /**
   * Apply a partial change to a persisted object, re-checking every invariant.
   * Returns a new instance; the original is left untouched. `title` and
   * `description` are trimmed. Passing no field is a valid no-op.
   */
  withChanges(changes: CollectionObjectChanges): CollectionObject {
    const next: CollectionObjectProps = {
      ...this.props,
      ...(changes.title !== undefined ? { title: changes.title.trim() } : {}),
      ...(changes.description !== undefined
        ? { description: changes.description.trim() }
        : {}),
      ...(changes.imageUrl !== undefined ? { imageUrl: changes.imageUrl } : {}),
      ...(changes.imageKey !== undefined ? { imageKey: changes.imageKey } : {}),
    };

    assertInvariants({
      title: next.title,
      description: next.description,
      imageUrl: next.imageUrl,
      imageKey: next.imageKey,
    });

    return new CollectionObject(next);
  }

  get id(): string {
    if (!this.props.id) throw new DomainError('object has not been persisted yet');
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  /** S3 key — infrastructure concern, never exposed over HTTP. */
  get imageKey(): string {
    return this.props.imageKey;
  }

  get createdAt(): Date {
    if (!this.props.createdAt)
      throw new DomainError('object has not been persisted yet');
    return this.props.createdAt;
  }
}

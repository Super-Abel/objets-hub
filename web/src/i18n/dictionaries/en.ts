import type { Dictionary } from './fr';

/** English translation. Must match `Dictionary` exactly — a missing or extra key is a compile error. */
export const en: Dictionary = {
  metadata: {
    title: 'Objects',
    description: 'Manage a collection of objects.',
  },
  header: {
    brand: 'Objects',
  },
  language: {
    label: 'Language',
  },
  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  board: {
    count: (n: number) => `${n} object${n === 1 ? '' : 's'}`,
    empty: 'No objects yet — create the first one.',
  },
  form: {
    heading: 'New object',
    title: 'Title',
    description: 'Description',
    image: 'Image',
    imageHint: (maxMb: number) => `JPEG, PNG, WebP or GIF · max ${maxMb} MB`,
    submit: 'Create object',
    submitting: 'Uploading…',
    imageRequired: 'Please pick an image.',
    imageNotConfirmed: 'Please confirm the selected image.',
    imagePreviewHeading: 'Confirm the image',
    imagePreviewHint: 'Check the preview before adding it to the object.',
    imagePreviewAlt: 'Selected image preview',
    confirmImage: 'Use this image',
    rejectImage: 'Choose another',
    imageConfirmed: 'Image confirmed',
    changeImage: 'Change image',
    created: 'Object created',
  },
  card: {
    delete: 'Delete',
    deleting: 'Deleting…',
    deleteConfirmTitle: 'Delete this object?',
    deleteConfirmDescription: (title: string) =>
      `“${title}” and its image will be permanently removed. This cannot be undone.`,
    deleteConfirmCancel: 'Cancel',
    deleteConfirmAction: 'Delete',
  },
  detail: {
    back: '← Back',
    created: (date: string) => `Created ${date}`,
  },
  notFound: {
    title: 'Object not found',
    description: 'It may have been deleted.',
    back: 'Back to list',
  },
  image: {
    unsupportedType: 'Unsupported image type (use JPEG, PNG, WebP or GIF).',
    tooLarge: (maxMb: number) => `Image is too large (max ${maxMb} MB).`,
  },
};

/**
 * Reference dictionary. Its shape (`Dictionary`) is the contract every other
 * locale must satisfy — add a key here first, then TypeScript forces `en.ts`
 * to provide it too. Entries that take a value are functions, so there is no
 * string-template mini-language to learn.
 */
export const fr = {
  metadata: {
    title: 'Objets',
    description: 'Gérez une collection d’objets.',
  },
  header: {
    brand: 'Objets',
  },
  language: {
    label: 'Langue',
  },
  theme: {
    label: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
  },
  board: {
    count: (n: number) => `${n} objet${n === 1 ? '' : 's'}`,
    empty: 'Aucun objet pour l’instant — créez le premier.',
  },
  form: {
    heading: 'Nouvel objet',
    title: 'Titre',
    description: 'Description',
    image: 'Image',
    imageHint: (maxMb: number) => `JPEG, PNG, WebP ou GIF · max ${maxMb} Mo`,
    submit: 'Créer l’objet',
    submitting: 'Envoi…',
    imageRequired: 'Veuillez choisir une image.',
    imageNotConfirmed: 'Veuillez confirmer l’image sélectionnée.',
    imagePreviewHeading: 'Confirmer l’image',
    imagePreviewHint: 'Vérifiez l’aperçu avant de l’ajouter à l’objet.',
    imagePreviewAlt: 'Aperçu de l’image sélectionnée',
    confirmImage: 'Confirmer',
    rejectImage: 'Choisir une autre',
    imageConfirmed: 'Image confirmée',
    changeImage: 'Changer d’image',
    created: 'Objet créé',
  },
  card: {
    delete: 'Supprimer',
    deleting: 'Suppression…',
    deleteConfirmTitle: 'Supprimer cet objet ?',
    deleteConfirmDescription: (title: string) =>
      `« ${title} » et son image seront définitivement supprimés. Cette action est irréversible.`,
    deleteConfirmCancel: 'Annuler',
    deleteConfirmAction: 'Supprimer',
  },
  edit: {
    trigger: 'Modifier',
    heading: 'Modifier l’objet',
    description: 'Mettez à jour le titre, la description ou l’image.',
    title: 'Titre',
    descriptionField: 'Description',
    image: 'Image',
    imageHint: (maxMb: number) =>
      `Laisser vide pour conserver l’image actuelle · JPEG, PNG, WebP ou GIF · max ${maxMb} Mo`,
    currentImageAlt: 'Image actuelle',
    newImageAlt: 'Nouvelle image',
    replaceImage: 'Remplacer l’image',
    clearImage: 'Annuler le remplacement',
    cancel: 'Annuler',
    submit: 'Enregistrer',
    submitting: 'Enregistrement…',
    saved: 'Objet mis à jour',
    noChanges: 'Aucune modification à enregistrer.',
  },
  detail: {
    back: '← Retour',
    created: (date: string) => `Créé le ${date}`,
  },
  notFound: {
    title: 'Objet introuvable',
    description: 'Il a peut-être été supprimé.',
    back: 'Retour à la liste',
  },
  image: {
    unsupportedType: 'Type d’image non supporté (JPEG, PNG, WebP ou GIF).',
    tooLarge: (maxMb: number) => `Image trop volumineuse (max ${maxMb} Mo).`,
  },
};

/** The single source of truth for the translation keys. */
export type Dictionary = typeof fr;

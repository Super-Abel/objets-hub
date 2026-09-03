import type { Locale } from '../config';
import { fr, type Dictionary } from './fr';
import { en } from './en';

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { fr, en };

/** Returns the message table for a locale (both are bundled — there are only two). */
export function resolveDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

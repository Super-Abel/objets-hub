'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from './config';
import { resolveDictionary, type Dictionary } from './dictionaries';

interface I18nValue {
  locale: Locale;
  /** The active message table (see `src/i18n/dictionaries/fr.ts`). */
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Seeds client components with the locale resolved on the server (in the root layout). */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: resolveDictionary(locale) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Shorthand for `useI18n().t` — the message table. */
export function useDictionary(): Dictionary {
  return useI18n().t;
}

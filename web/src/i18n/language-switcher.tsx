'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';
import { LOCALE_COOKIE, locales, type Locale } from './config';
import { useI18n } from './provider';

/** FR / EN toggle. Writes the `locale` cookie, then refreshes so the server re-renders. */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="flex items-center rounded-lg border bg-background/60 p-0.5 text-xs font-semibold"
      role="group"
      aria-label={t.language.label}
    >
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => switchTo(option)}
          disabled={pending}
          aria-pressed={option === locale}
          className={cn(
            'rounded-md px-2 py-1 uppercase tracking-wide transition-colors disabled:opacity-50',
            option === locale
              ? 'bg-brand text-brand-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

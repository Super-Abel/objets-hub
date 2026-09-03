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
      className="flex items-center gap-1 text-xs font-medium"
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
            'rounded px-1.5 py-0.5 uppercase transition-colors disabled:opacity-50',
            option === locale
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useDictionary } from '@/i18n/provider';

/** Light ⇄ dark toggle. Renders a stable placeholder until mounted to avoid hydration mismatch. */
export function ThemeToggle() {
  const t = useDictionary();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  // Before mount `resolvedTheme` is unknown on both server and client, so keep
  // every theme-dependent attribute static until then.
  const nextLabel = mounted
    ? isDark
      ? t.theme.light
      : t.theme.dark
    : undefined;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={nextLabel ? `${t.theme.label}: ${nextLabel}` : t.theme.label}
      title={nextLabel}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">{t.theme.label}</span>
    </Button>
  );
}

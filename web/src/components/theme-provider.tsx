'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/** Thin wrapper so the (client-only) next-themes provider can sit in the server layout. */
export function ThemeProvider(
  props: React.ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}

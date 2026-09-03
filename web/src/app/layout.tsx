import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/language-switcher';
import { getDictionary, getLocale } from '@/i18n/server';
import './globals.css';

export function generateMetadata(): Metadata {
  const t = getDictionary();
  return {
    title: t.metadata.title,
    description: t.metadata.description,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const t = getDictionary();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider locale={locale}>
            <header className="border-b">
              <div className="container flex h-14 items-center justify-between">
                <Link href="/" className="font-semibold">
                  {t.header.brand}
                </Link>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="container py-8">{children}</main>
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

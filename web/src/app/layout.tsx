import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/i18n/provider';
import { LanguageSwitcher } from '@/i18n/language-switcher';
import { getDictionary, getLocale } from '@/i18n/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

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
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider locale={locale}>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between">
                  <Link
                    href="/"
                    className="group flex items-center gap-2.5 font-semibold"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand/70 text-brand-foreground shadow-sm transition-transform group-hover:scale-105">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </svg>
                    </span>
                    <span className="tracking-tight">{t.header.brand}</span>
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>
              </header>

              <main className="container flex-1 py-8 sm:py-10">{children}</main>

              <footer className="border-t border-border/60 py-6">
                <div className="container text-xs text-muted-foreground">
                  {t.header.brand} · {new Date().getFullYear()}
                </div>
              </footer>
            </div>
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

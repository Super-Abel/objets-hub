/** Single source of truth for where the API lives (REST + Socket.IO share the origin). */
function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return 'http://localhost:4000';
  // Render's `fromService` injects a bare hostname; add the scheme it omits.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

export const API_URL = resolveApiUrl();

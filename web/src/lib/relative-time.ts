/**
 * Human-friendly "3 hours ago" using the platform `Intl.RelativeTimeFormat`.
 * Falls back to a localized absolute date once the delta passes a week, so old
 * items still read as a real date rather than "51 weeks ago".
 */
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
];

export function formatRelativeTime(date: Date | string, locale: string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  let delta = (value.getTime() - Date.now()) / 1000;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(delta) < amount) {
      return rtf.format(Math.round(delta), unit);
    }
    delta /= amount;
  }

  return value.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

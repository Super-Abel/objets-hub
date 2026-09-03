import { cookies } from 'next/headers';
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { resolveDictionary, type Dictionary } from './dictionaries';

/** Active locale for the current request, from the `locale` cookie. Server components only. */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Message table for the current request. Use in Server Components / `generateMetadata`. */
export function getDictionary(): Dictionary {
  return resolveDictionary(getLocale());
}

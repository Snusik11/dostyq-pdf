import { en } from '@/shared/i18n/en';
import { kk } from '@/shared/i18n/kk';
import { ru } from '@/shared/i18n/ru';
import type { Locale, TranslationParams, TranslationValue } from '@/shared/i18n/types';

/** Every valid translation key — derived from `en.ts`, the canonical dictionary. */
export type TranslationKey = keyof typeof en;

export type Dictionary = Record<TranslationKey, TranslationValue>;

export const DICTIONARIES: Record<Locale, Dictionary> = { kk, ru };

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = params[token];
    return value === undefined ? match : String(value);
  });
}

const pluralRulesCache = new Map<string, Intl.PluralRules>();

/** CLDR plural category for `n` in `locale` (rules objects are cached — constructing one is not free). */
function pluralCategory(locale: string, n: number): Intl.LDMLPluralRule {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules.select(Math.abs(n));
}

/**
 * Resolves `key` against `dictionary`: selects the plural form via
 * `params.n` and `pluralLocale`'s CLDR rules when the entry is a
 * `PluralForms` set (a category the entry does not define falls back to
 * `other`; a missing or non-numeric `n` also selects `other`), then
 * interpolates any `{token}` placeholders from `params`. `pluralLocale`
 * defaults to `'en'`, the locale of the source dictionary.
 *
 * Missing-key fallback (documented behavior, see `i18n.test.tsx`): returns
 * the raw key string itself instead of throwing. `TranslationKey` already
 * makes an unknown key a compile error at normal call sites — this runtime
 * guard only matters for a key resolved dynamically (e.g. cast from an
 * external source), where surfacing the key string is more debuggable than
 * a hard crash or a blank label.
 */
export function translate(
  dictionary: Dictionary,
  key: TranslationKey,
  params?: TranslationParams,
  pluralLocale = 'en',
): string {
  const entry: TranslationValue | undefined = dictionary[key];
  if (entry === undefined) {
    return key;
  }
  if (typeof entry === 'string') {
    return interpolate(entry, params);
  }
  const n = params?.n;
  const category = typeof n === 'number' ? pluralCategory(pluralLocale, n) : 'other';
  const form =
    category === 'one' ? entry.one : category === 'few' ? entry.few : category === 'many' ? entry.many : undefined;
  return interpolate(form ?? entry.other, params);
}

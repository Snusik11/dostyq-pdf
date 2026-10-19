/**
 * Shared i18n primitive types (Kazakh / Russian UI).
 * Deliberately dependency-free (no React import) so the dictionaries can be
 * imported from anywhere (including the worker bundle, if ever needed)
 * without pulling in React.
 */

/** UI languages a user can choose: Kazakh and Russian. */
export type Locale = 'kk' | 'ru';

/**
 * Locale of an active translation context: the two user-selectable languages
 * plus `'en'`, the source dictionary. `'en'` is never offered in the UI — it
 * is only the context value when no `<LocaleProvider>` is mounted (bare
 * component renders in unit tests), which keeps their English text assertions
 * valid without wrapping every test in a provider.
 */
export type ContextLocale = Locale | 'en';

/** Values passed to `t(key, params)` for `{token}` interpolation. */
export type TranslationParams = Record<string, string | number>;

/**
 * A count-driven set of forms selected by `params.n` through the locale's
 * CLDR plural rules (`Intl.PluralRules`):
 * - English and Kazakh only need `one` / `other` (Kazakh nouns stay singular
 *   after a numeral, so both forms are usually identical);
 * - Russian needs `one` (1, 21, 31 …), `few` (2–4, 22–24 …) and `many`
 *   (0, 5–20, 25–30 …). `other` covers fractions and is the fallback for any
 *   category a dictionary entry does not define.
 */
export interface PluralForms {
  readonly one: string;
  readonly other: string;
  readonly few?: string;
  readonly many?: string;
}

export type TranslationValue = string | PluralForms;

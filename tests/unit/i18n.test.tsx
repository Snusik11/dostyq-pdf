import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocaleProvider, useTranslation } from '@/shared/i18n';
import type { TranslationKey } from '@/shared/i18n';

/**
 * i18n unit tests: `useTranslation()`'s no-provider English fallback (keeps
 * the bare-render test assertions green — see `LocaleProvider.tsx`'s
 * `defaultContextValue` doc comment), `<LocaleProvider>`'s real Kazakh/Russian
 * locale resolution and localStorage persistence, CLDR pluralization (Russian
 * has three forms, Kazakh one), and the documented missing-key fallback
 * (returns the raw key string).
 */

const STORAGE_KEY = 'dostyq-pdf.locale';

function Harness(): ReactNode {
  const { t, locale, setLocale } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="scan-complete-plural">{t('scanner.scanComplete', { n: 2 })}</span>
      <span data-testid="scan-complete-singular">{t('scanner.scanComplete', { n: 1 })}</span>
      <span data-testid="welcome-open-camera">{t('welcome.openCamera')}</span>
      <span data-testid="a4-probable">{t('paper.a4Probable')}</span>
      <button type="button" onClick={() => setLocale('kk')} data-testid="set-kk">
        kk
      </button>
      <button type="button" onClick={() => setLocale('ru')} data-testid="set-ru">
        ru
      </button>
    </div>
  );
}

function PluralHarness({ n }: { n: number }): ReactNode {
  const { t } = useTranslation();
  return <span data-testid="plural">{t('grid.pageCount', { n })}</span>;
}

function MissingKeyHarness(): ReactNode {
  const { t } = useTranslation();
  // Deliberately cast an unknown string to `TranslationKey` — `TranslationKey`
  // itself makes this a compile error at normal call sites; this simulates a
  // key resolved dynamically (e.g. from an external source) that doesn't
  // exist in any dictionary.
  return <span data-testid="missing-key">{t('does.not.exist' as TranslationKey)}</span>;
}

/** Stubs `navigator.language`, so `resolveInitialLocale`'s detection is exercised deterministically regardless of the test runner's own locale. */
function stubNavigatorLanguage(value: string): void {
  Object.defineProperty(window.navigator, 'language', { value, configurable: true });
}

function renderPlural(n: number): string {
  render(
    <LocaleProvider>
      <PluralHarness n={n} />
    </LocaleProvider>,
  );
  const text = screen.getByTestId('plural').textContent ?? '';
  cleanup();
  return text;
}

describe('i18n (Kazakh / Russian UI)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    stubNavigatorLanguage('fr-FR');
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('useTranslation() WITHOUT a <LocaleProvider> falls back to the English source dictionary', () => {
    render(<Harness />);
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('scan-complete-plural').textContent).toBe('Scan complete — 2 pages.');
    expect(screen.getByTestId('a4-probable').textContent).toBe('A4 probable');
  });

  it('<LocaleProvider> defaults to Russian for a non-Kazakh browser with no stored preference', () => {
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('ru');
    expect(screen.getByTestId('scan-complete-plural').textContent).toBe('Сканирование завершено — 2 страницы.');
    expect(screen.getByTestId('welcome-open-camera').textContent).toBe('Сканировать');
    expect(screen.getByTestId('a4-probable').textContent).toBe('Вероятно, A4');
  });

  it('<LocaleProvider> picks Kazakh when the browser language is Kazakh', () => {
    stubNavigatorLanguage('kk-KZ');
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('kk');
    expect(screen.getByTestId('welcome-open-camera').textContent).toBe('Сканерлеу');
  });

  it('setLocale flips the active locale and persists the choice to localStorage', () => {
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByTestId('set-kk'));
    expect(screen.getByTestId('locale').textContent).toBe('kk');
    expect(screen.getByTestId('scan-complete-plural').textContent).toBe('Сканерлеу аяқталды — 2 бет.');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('kk');

    fireEvent.click(screen.getByTestId('set-ru'));
    expect(screen.getByTestId('locale').textContent).toBe('ru');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('ru');
  });

  it('a fresh <LocaleProvider> mount honors a previously persisted locale', () => {
    window.localStorage.setItem(STORAGE_KEY, 'kk');
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('kk');
  });

  it('ignores a stored value that is not a supported locale (e.g. a leftover "en")', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('ru');
  });

  it('uses the singular form for n = 1 in both locales', () => {
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('scan-complete-singular').textContent).toBe('Сканирование завершено — 1 страница.');

    fireEvent.click(screen.getByTestId('set-kk'));
    expect(screen.getByTestId('scan-complete-singular').textContent).toBe('Сканерлеу аяқталды — 1 бет.');
  });

  it.each([
    [0, '0 страниц'],
    [1, '1 страница'],
    [2, '2 страницы'],
    [4, '4 страницы'],
    [5, '5 страниц'],
    [11, '11 страниц'],
    [12, '12 страниц'],
    [21, '21 страница'],
    [22, '22 страницы'],
    [25, '25 страниц'],
    [101, '101 страница'],
  ])('Russian pluralizes %i as "%s" (one / few / many)', (n, expected) => {
    expect(renderPlural(n)).toBe(expected);
  });

  it('Kazakh keeps the noun singular after any numeral', () => {
    window.localStorage.setItem(STORAGE_KEY, 'kk');
    expect(renderPlural(1)).toBe('1 бет');
    expect(renderPlural(5)).toBe('5 бет');
    expect(renderPlural(22)).toBe('22 бет');
  });

  it('keeps <html lang> in sync with the active locale', () => {
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    );
    expect(document.documentElement.lang).toBe('ru');

    fireEvent.click(screen.getByTestId('set-kk'));
    expect(document.documentElement.lang).toBe('kk');

    fireEvent.click(screen.getByTestId('set-ru'));
    expect(document.documentElement.lang).toBe('ru');
  });

  it('falls back to the raw key string for a missing/unknown key (documented behavior)', () => {
    render(
      <LocaleProvider>
        <MissingKeyHarness />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('missing-key').textContent).toBe('does.not.exist');
  });
});

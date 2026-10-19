import { describe, expect, it } from 'vitest';
import { formatMegabytes } from '@/shared/lib/formatBytes';

const MB = 1024 * 1024;

describe('formatMegabytes', () => {
  it('formats with one decimal and the locale decimal separator', () => {
    expect(formatMegabytes(11.06 * MB, 'en')).toBe('11.1');
    // Russian and Kazakh use a decimal comma; Intl may use a non-breaking character only for grouping.
    expect(formatMegabytes(11.06 * MB, 'ru')).toBe('11,1');
    expect(formatMegabytes(5.2 * MB, 'kk')).toBe('5,2');
  });

  it('counts megabytes as 1024 x 1024 bytes, the unit of the 20 MB upload limit', () => {
    expect(formatMegabytes(20 * 1024 * 1024, 'en')).toBe('20.0');
    expect(formatMegabytes(20_000_000, 'en')).toBe('19.1');
  });

  it('shows "<0.1" instead of "0.0" for tiny files', () => {
    expect(formatMegabytes(3_000, 'en')).toBe('<0.1');
    expect(formatMegabytes(0, 'ru')).toBe('<0,1');
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DostyqMark } from '@/shared/ui/DostyqMark';
import { DOSTYQ_MARK_PATH, DOSTYQ_MARK_VIEWBOX } from '@/shared/ui/dostyqMarkPath';

afterEach(cleanup);

describe('DostyqMark', () => {
  it('keeps the path copy in code identical to public/icons/logo-mark.svg (the source of truth)', () => {
    const svg = readFileSync(join(process.cwd(), 'public/icons/logo-mark.svg'), 'utf8');
    expect(/ d="([^"]+)"/.exec(svg)?.[1]).toBe(DOSTYQ_MARK_PATH);
    const viewBox = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
    expect(Number(viewBox?.[1])).toBe(DOSTYQ_MARK_VIEWBOX.width);
    expect(Number(viewBox?.[2])).toBe(DOSTYQ_MARK_VIEWBOX.height);
  });

  it('draws in the surrounding text colour and is hidden from assistive technology', () => {
    const { container } = render(<DostyqMark size={30} className="text-primary" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('text-primary');
    expect(svg?.querySelector('path')).toHaveAttribute('fill', 'currentColor');
  });

  it('scales the width with the mark aspect ratio', () => {
    const { container } = render(<DostyqMark size={47} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('height', '47');
    const expectedWidth = (47 * DOSTYQ_MARK_VIEWBOX.width) / DOSTYQ_MARK_VIEWBOX.height;
    expect(Number(svg?.getAttribute('width'))).toBeCloseTo(expectedWidth, 5);
  });
});

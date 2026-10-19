// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import config from '../../tailwind.config';

/**
 * Tailwind silently DROPS an opacity modifier (`bg-bg/70`) on a colour that is a
 * plain `var(--color-*)` or hex: no error, the class just produces no CSS. That
 * left the page drag handle, toast borders, the dialog scrim and ~50 other
 * places without the colour they were written with. The theme colours are now
 * `rgb(var(--color-*-rgb) / <alpha-value>)`; these tests make sure every such
 * class used in the source really gets a rule.
 */

const COLOURS = ['surface-light', 'surface-2', 'surface', 'text-muted', 'text', 'primary-dark', 'primary-light', 'primary', 'success', 'warning', 'danger', 'bg'];
const UTILITIES = ['bg', 'text', 'border', 'ring', 'shadow', 'from', 'via', 'to', 'outline', 'divide', 'decoration', 'placeholder', 'fill', 'stroke'];
const OPACITY_CLASS = new RegExp(`(?<![\\w-])(?:${UTILITIES.join('|')})-(?:${COLOURS.join('|')})/\\d+(?![\\w/])`, 'g');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|html)$/.test(name) ? [path] : [];
  });
}

async function generate(classes: readonly string[]): Promise<string> {
  const result = await postcss([tailwindcss({ ...config, content: [{ raw: classes.join(' ') }] })]).process('@tailwind utilities;', {
    from: undefined,
  });
  return result.css;
}

const escape = (className: string): string => `.${className.replace(/\//g, '\\/')}`;

describe('theme colours accept opacity modifiers', () => {
  it('turns bg-bg/70 into the colour channels with that alpha', async () => {
    const css = await generate(['bg-bg/70', 'border-text/15']);
    expect(css).toContain(escape('bg-bg/70'));
    expect(css).toContain('rgb(var(--color-bg-rgb) / 0.7)');
    expect(css).toContain('rgb(var(--color-text-rgb) / 0.15)');
  });

  it('still produces the plain, fully opaque class', async () => {
    const css = await generate(['bg-primary']);
    expect(css).toContain('--tw-bg-opacity: 1');
    expect(css).toContain('rgb(var(--color-primary-rgb) / var(--tw-bg-opacity, 1))');
  });

  it('generates a rule for every opacity class used in src/ (none may be silently dropped)', async () => {
    const used = new Set<string>();
    for (const file of [...sourceFiles(join(process.cwd(), 'src')), join(process.cwd(), 'index.html')]) {
      for (const match of readFileSync(file, 'utf8').matchAll(OPACITY_CLASS)) used.add(match[0]);
    }
    // The source really does use some; an empty set would make this test vacuous.
    expect(used.size).toBeGreaterThan(20);

    const css = await generate([...used]);
    const missing = [...used].filter((className) => !css.includes(escape(className)));
    expect(missing).toEqual([]);
  });
});

// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * public/_headers is read by Cloudflare Pages, not by Vite or the browser, so
 * nothing else would notice if it broke. These checks encode the documented
 * rules that matter: the limits, and that no header name is set by two rules
 * (Pages joins repeated headers from overlapping rules with a comma).
 */

interface Rule {
  readonly path: string;
  readonly headers: ReadonlyMap<string, string>;
}

const raw = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');
const lines = raw.split('\n');

function parse(): Rule[] {
  const rules: { path: string; headers: Map<string, string> }[] = [];
  for (const line of lines) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (/^\s/.test(line)) {
      const colon = line.indexOf(':');
      const current = rules[rules.length - 1];
      if (!current || colon < 0) throw new Error(`Header line outside a rule: ${line}`);
      current.headers.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
    } else {
      rules.push({ path: line.trim(), headers: new Map() });
    }
  }
  return rules;
}

const rules = parse();

describe('public/_headers (Cloudflare Pages)', () => {
  it('stays inside the documented limits: 100 rules, 2000 characters per line', () => {
    expect(rules.length).toBeLessThanOrEqual(100);
    expect(Math.max(...lines.map((line) => line.length))).toBeLessThanOrEqual(2000);
  });

  it('every rule sets at least one header', () => {
    for (const rule of rules) expect(rule.headers.size, rule.path).toBeGreaterThan(0);
  });

  it('sets each header name in exactly one rule, so overlapping rules never double up', () => {
    const seen = new Map<string, string>();
    for (const rule of rules) {
      for (const name of rule.headers.keys()) {
        expect(seen.get(name), `${name} is set by both ${seen.get(name)} and ${rule.path}`).toBeUndefined();
        seen.set(name, rule.path);
      }
    }
  });

  it('caches only the content-hashed files under /assets/ for a long time', () => {
    const cached = rules.filter((rule) => rule.headers.has('cache-control'));
    expect(cached.map((rule) => rule.path)).toEqual(['/assets/*']);
    expect(cached[0]?.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('keeps the camera usable: the app is the camera page, so camera=(self) must stay allowed', () => {
    const policy = rules.flatMap((rule) => [...rule.headers]).find(([name]) => name === 'permissions-policy')?.[1];
    expect(policy).toContain('camera=(self)');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startAnalytics } from '@/shared/lib/analytics';

const TOKEN = '0123456789abcdef0123456789abcdef';
const BEACON = 'script[src="https://static.cloudflareinsights.com/beacon.min.js"]';

/** A detached document: nothing in it is ever loaded or executed. */
function freshDocument(): Document {
  return document.implementation.createHTMLDocument('analytics');
}

describe('startAnalytics', () => {
  // happy-dom reports (but does not perform) the load of an external script as
  // soon as one with a `src` is attached; that is not what is under test here.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds the Cloudflare Web Analytics script with the token', () => {
    const doc = freshDocument();
    expect(startAnalytics(TOKEN, doc)).toBe(true);

    const script = doc.head.querySelector<HTMLScriptElement>(BEACON);
    expect(script).not.toBeNull();
    expect(script?.type).toBe('module');
    expect(JSON.parse(script?.getAttribute('data-cf-beacon') ?? '{}')).toEqual({ token: TOKEN });
  });

  it('does nothing without a token', () => {
    const doc = freshDocument();
    expect(startAnalytics(undefined, doc)).toBe(false);
    expect(startAnalytics('', doc)).toBe(false);
    expect(doc.head.querySelector(BEACON)).toBeNull();
  });

  it('rejects a value that is not a plausible token instead of putting it into the page', () => {
    const doc = freshDocument();
    expect(startAnalytics('"><script>alert(1)</script>', doc)).toBe(false);
    expect(startAnalytics('short', doc)).toBe(false);
    expect(doc.head.querySelector(BEACON)).toBeNull();
  });

  it('never adds the script twice', () => {
    const doc = freshDocument();
    expect(startAnalytics(TOKEN, doc)).toBe(true);
    expect(startAnalytics(TOKEN, doc)).toBe(true);
    expect(doc.head.querySelectorAll(BEACON)).toHaveLength(1);
  });
});

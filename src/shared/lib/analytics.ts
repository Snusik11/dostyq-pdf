/**
 * Optional visit counter: Cloudflare Web Analytics.
 *
 * It is cookie-less and does not follow people across sites; it only counts page
 * views. It is OFF unless a token is supplied at build time
 * (`VITE_CF_ANALYTICS_TOKEN`); `main.tsx` only reaches this module in that case,
 * so a build without a token contains none of this code (checked on every build
 * by scripts/assert-production-bundle-hygiene.mjs). The photos themselves never
 * leave the device either way.
 */

const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
/** Site tokens are opaque strings of letters and digits; anything else is a mistake, not a token. */
const TOKEN_PATTERN = /^[A-Za-z0-9]{16,64}$/;

/**
 * Adds the Cloudflare Web Analytics script to the page. Returns whether it is
 * (now) present. Does nothing for a missing or malformed token, and never adds
 * the script twice.
 */
export function startAnalytics(token: string | undefined, doc: Document = document): boolean {
  if (token === undefined || !TOKEN_PATTERN.test(token)) {
    return false;
  }
  if (doc.querySelector(`script[src="${BEACON_SRC}"]`)) {
    return true;
  }
  const script = doc.createElement('script');
  // Same form as the snippet in Cloudflare's documentation.
  script.type = 'module';
  script.src = BEACON_SRC;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  doc.head.appendChild(script);
  return true;
}

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'node:fs/promises';
import { loadEnv } from 'vite';

const harnessTokens = ['__e2e_manual_guide_raster__', 'ManualGuideBatchRasterHarness'];
// The visit counter is opt-in. Without a token at build time nothing about it may
// ship: no script, no beacon URL, no request to a third-party server. `loadEnv`
// reads the same sources Vite does (process env plus the .env files).
const analyticsEnabled = Boolean(loadEnv('production', process.cwd(), 'VITE_').VITE_CF_ANALYTICS_TOKEN);
const analyticsTokens = analyticsEnabled ? [] : ['cloudflareinsights'];

const files = await Array.fromAsync(glob('**/*', { cwd: resolve('dist'), withFileTypes: true }));
const harnessViolations = [];
const analyticsViolations = [];

for (const file of files) {
  if (!file.isFile()) continue;
  const path = resolve('dist', file.parentPath, file.name);
  const contents = await readFile(path, 'utf8');
  for (const token of harnessTokens) {
    if (contents.includes(token)) harnessViolations.push(`${path}: ${token}`);
  }
  for (const token of analyticsTokens) {
    if (contents.includes(token)) analyticsViolations.push(`${path}: ${token}`);
  }
}

if (harnessViolations.length > 0) {
  throw new Error(`Production bundle exposes E2E-only manual-guide harness:\n${harnessViolations.join('\n')}`);
}
if (analyticsViolations.length > 0) {
  throw new Error(
    `Production bundle contains the analytics beacon although VITE_CF_ANALYTICS_TOKEN is not set:\n${analyticsViolations.join('\n')}`,
  );
}

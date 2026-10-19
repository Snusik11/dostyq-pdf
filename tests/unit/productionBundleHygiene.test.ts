// @vitest-environment node
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const hygieneScript = resolve(process.cwd(), 'scripts/assert-production-bundle-hygiene.mjs');
const temporaryDirs: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirs.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('production bundle hygiene', () => {
  it('rejects a forbidden token even when NITIDOC_E2E is ambient', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nitidoc-hygiene-'));
    temporaryDirs.push(directory);
    await mkdir(join(directory, 'dist'));
    await writeFile(join(directory, 'dist', 'forbidden.js'), 'ManualGuideBatchRasterHarness');

    await expect(execFileAsync(process.execPath, [hygieneScript], {
      cwd: directory,
      env: { ...process.env, NITIDOC_E2E: '1' },
    })).rejects.toThrow('Production bundle exposes E2E-only manual-guide harness');
  });

  describe('optional analytics', () => {
    async function bundleWithBeacon(): Promise<string> {
      const directory = await mkdtemp(join(tmpdir(), 'dostyq-pdf-hygiene-'));
      temporaryDirs.push(directory);
      await mkdir(join(directory, 'dist'));
      await writeFile(join(directory, 'dist', 'app.js'), 'src="https://static.cloudflareinsights.com/beacon.min.js"');
      return directory;
    }

    /** The ambient env of the test run must not leak a token into (or out of) the script. */
    function envWith(token: string | undefined): NodeJS.ProcessEnv {
      const { VITE_CF_ANALYTICS_TOKEN: _ignored, ...rest } = process.env;
      return token === undefined ? rest : { ...rest, VITE_CF_ANALYTICS_TOKEN: token };
    }

    it('rejects the analytics beacon in a bundle built without a token', async () => {
      const directory = await bundleWithBeacon();
      await expect(execFileAsync(process.execPath, [hygieneScript], { cwd: directory, env: envWith(undefined) }))
        .rejects.toThrow('contains the analytics beacon although VITE_CF_ANALYTICS_TOKEN is not set');
    });

    it('accepts the analytics beacon when a token was configured for the build', async () => {
      const directory = await bundleWithBeacon();
      await expect(
        execFileAsync(process.execPath, [hygieneScript], { cwd: directory, env: envWith('0123456789abcdef0123456789abcdef') }),
      ).resolves.toBeDefined();
    });
  });
});

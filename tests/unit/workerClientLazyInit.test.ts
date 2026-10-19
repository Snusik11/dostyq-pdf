import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * OpenCV is loaded lazily for the shared worker client: `init()` is idempotent
 * while an attempt is pending or done, a failed attempt can be retried, and
 * every RPC that needs OpenCV waits for (or starts) the load itself. A fake
 * Worker records what is posted and lets the test answer by hand.
 */

type Posted = { id: number; type: string };

let posted: Posted[] = [];
let reply: (data: unknown) => void = () => {};

class FakeWorker {
  private listener: ((event: MessageEvent) => void) | null = null;
  readonly terminate = vi.fn();
  constructor() {
    reply = (data) => this.listener?.({ data } as MessageEvent);
  }
  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    if (type === 'message') this.listener = listener;
  }
  removeEventListener(): void {}
  postMessage(message: Posted): void {
    posted.push(message);
  }
}

const image = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
const types = (): string[] => posted.map((m) => m.type);
const flush = async (): Promise<void> => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};

describe('getSharedWorkerClient lazy OpenCV init', () => {
  beforeEach(() => {
    posted = [];
    vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts INIT by itself and sends APPLY_FILTER only after INIT_DONE', async () => {
    const { getSharedWorkerClient } = await import('@/features/scanner/lib/workerClient');
    const client = getSharedWorkerClient();

    const result = client.applyFilter(image as never, [], false);
    await flush();
    expect(types()).toEqual(['INIT']);

    reply({ id: posted[0]!.id, type: 'INIT_DONE' });
    await flush();
    expect(types()).toEqual(['INIT', 'APPLY_FILTER']);

    reply({ id: posted[1]!.id, type: 'APPLY_FILTER_RESULT', results: [] });
    await expect(result).resolves.toMatchObject({ results: [] });
  });

  it('shares one INIT between an explicit init() and a waiting RPC, and never re-inits once ready', async () => {
    const { getSharedWorkerClient } = await import('@/features/scanner/lib/workerClient');
    const client = getSharedWorkerClient();

    const warmUp = client.init(() => {});
    void client.applyFilter(image as never, [], false).catch(() => {});
    await flush();
    expect(types()).toEqual(['INIT']);

    reply({ id: posted[0]!.id, type: 'INIT_DONE' });
    await warmUp;
    await client.init(() => {});
    expect(types().filter((t) => t === 'INIT')).toHaveLength(1);
  });

  it('lets a failed load be retried with a fresh INIT', async () => {
    const { getSharedWorkerClient } = await import('@/features/scanner/lib/workerClient');
    const client = getSharedWorkerClient();

    const first = client.init(() => {});
    await flush();
    reply({ id: posted[0]!.id, type: 'ERROR', code: 'OPENCV_LOAD_FAILED', message: 'offline' });
    await expect(first).rejects.toThrow('offline');

    const second = client.init(() => {});
    await flush();
    expect(types()).toEqual(['INIT', 'INIT']);
    reply({ id: posted[1]!.id, type: 'INIT_DONE' });
    await expect(second).resolves.toBeUndefined();
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentPage } from '@/features/scanner/store/documentSlice';

const buildPdfMock = vi.fn();
vi.mock('@/features/scanner/lib/exportPdf', () => ({
  buildPdf: (...args: unknown[]) => buildPdfMock(...args),
}));

import { usePdfBuild } from '@/features/scanner/hooks/usePdfBuild';

const pages = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as unknown as readonly DocumentPage[];
const built = { doc: {}, bytes: 5_000_000, pageCount: 3 };

interface BuildOptions {
  signal: AbortSignal;
  onProgress: (done: number, total: number) => void;
}

describe('usePdfBuild', () => {
  beforeEach(() => {
    buildPdfMock.mockReset();
  });

  it('stays idle and builds nothing while disabled', () => {
    const { result } = renderHook(() => usePdfBuild(pages, false));
    expect(result.current).toEqual({ status: 'idle' });
    expect(buildPdfMock).not.toHaveBeenCalled();
  });

  it('stays idle when there are no pages', () => {
    const { result } = renderHook(() => usePdfBuild([], true));
    expect(result.current).toEqual({ status: 'idle' });
    expect(buildPdfMock).not.toHaveBeenCalled();
  });

  it('reports progress while building, then the finished PDF', async () => {
    let options!: BuildOptions;
    let finish!: (value: unknown) => void;
    buildPdfMock.mockImplementation((_pages: unknown, opts: BuildOptions) => {
      options = opts;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });

    const { result } = renderHook(() => usePdfBuild(pages, true));
    expect(result.current).toEqual({ status: 'building', done: 0, total: 3 });

    act(() => options.onProgress(2, 3));
    expect(result.current).toEqual({ status: 'building', done: 2, total: 3 });

    await act(async () => finish(built));
    expect(result.current).toEqual({ status: 'ready', built });
  });

  it('reports an error when the build fails', async () => {
    buildPdfMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => usePdfBuild(pages, true));
    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });

  it('aborts the build in flight on unmount and ignores its late result', async () => {
    let options!: BuildOptions;
    let finish!: (value: unknown) => void;
    buildPdfMock.mockImplementation((_pages: unknown, opts: BuildOptions) => {
      options = opts;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });

    const { result, unmount } = renderHook(() => usePdfBuild(pages, true));
    expect(options.signal.aborted).toBe(false);
    unmount();
    expect(options.signal.aborted).toBe(true);

    await act(async () => finish(built));
    // No state update after unmount, so the last value is still "building".
    expect(result.current).toEqual({ status: 'building', done: 0, total: 3 });
  });

  it('restarts the build when the pages change', async () => {
    buildPdfMock.mockResolvedValue(built);
    const { result, rerender } = renderHook(({ list }) => usePdfBuild(list, true), { initialProps: { list: pages } });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(buildPdfMock).toHaveBeenCalledTimes(1);

    rerender({ list: [...pages, { id: 'd' } as unknown as DocumentPage] });
    expect(buildPdfMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, forwardRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Group 6 / Slice F regression test for the bug found and fixed while
 * building the task 7.2 E2E fixture test: OpenCV was previously ONLY ever
 * initialized as a side effect of the live-detection loop starting
 * (`useDocumentDetection.start()`, which requires a granted camera
 * permission and a mounted <video>). When the import fallback is reached
 * WITHOUT the camera ever opening (permission denied, or no camera at all —
 * tasks 6.1/6.2), nothing ever called OpenCV `INIT`, so both the one-shot
 * DETECT (task 6.3.2) and the editor's later WARP call failed with
 * NOT_INITIALIZED every single time.
 *
 * Original fix: ScannerScreen called `ensureOpenCvInit()` as soon as the
 * scanner started. Dostyq PDF no longer needs OpenCV to produce pages (auto
 * crop is off) so the load is lazy: it is warmed up once the pages exist
 * (adjust/grid/done), and the shared worker client also starts/awaits it on
 * demand. These tests pin that timing, camera or no camera.
 *
 * Fase 2.3 Unit 6: the live-detection loop (`useDocumentDetection.ts`,
 * `start`/`stop`) is REMOVED entirely — `ensureOpenCvInit`/`workerClient` now
 * come straight from `useOpenCvInit` (mocked below), ScannerScreen's sole
 * call site. The original assertion that the live loop's own `start()` was
 * never invoked no longer applies (there is no such loop left to invoke) —
 * this rewrite keeps the suite's real INTENT: OpenCV init fires regardless
 * of camera outcome.
 */

const ensureOpenCvInitMock = vi.fn(async () => {});

vi.mock('@/features/scanner/hooks/useCamera', () => ({
  useCamera: () => ({
    openCamera: vi.fn(async () => {}),
    switchCamera: vi.fn(async () => {}),
    setTorch: vi.fn(async () => {}),
  }),
}));

vi.mock('@/features/scanner/hooks/useOpenCvInit', () => ({
  useOpenCvInit: () => ({
    workerClient: {
      init: vi.fn(async () => {}),
      detect: vi.fn(),
      detectImageData: vi.fn(),
      warp: vi.fn(),
      isBusy: vi.fn(() => false),
      terminate: vi.fn(),
    },
    initState: { status: 'idle', progress: 0 },
    retryManualInit: vi.fn(),
    ensureOpenCvInit: ensureOpenCvInitMock,
  }),
}));

vi.mock('@/features/scanner/components/CameraView', () => ({
  CameraView: forwardRef<HTMLVideoElement, { overlay?: unknown }>((_props, ref) =>
    createElement('video', { ref, 'data-testid': 'camera-view-video' }),
  ),
}));

import { ScannerScreen } from '@/features/scanner/components/ScannerScreen';
import { ToastHost } from '@/shared/ui';
import { useScannerStore, scannerStoreInitialState } from '@/features/scanner/store/scannerStore';

describe('ScannerScreen ensures OpenCV init even without a camera (bug fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not load OpenCV just because the scanner opened, with or without a camera', async () => {
    useScannerStore.setState({ ...scannerStoreInitialState, permission: 'denied' });

    render(
      <ToastHost>
        <ScannerScreen />
      </ToastHost>,
    );
    fireEvent.click(screen.getByTestId('open-scanner'));

    expect(await screen.findByTestId('import-fallback')).toBeTruthy();
    expect(ensureOpenCvInitMock).not.toHaveBeenCalled();
  });

  it('warms OpenCV up once, in the background, as soon as the pages exist (filters and crop become reachable)', async () => {
    useScannerStore.setState({ ...scannerStoreInitialState, permission: 'denied' });

    render(
      <ToastHost>
        <ScannerScreen />
      </ToastHost>,
    );
    fireEvent.click(screen.getByTestId('open-scanner'));
    expect(ensureOpenCvInitMock).not.toHaveBeenCalled();

    act(() => {
      useScannerStore.getState().setPhase('adjust');
    });

    await waitFor(() => {
      expect(ensureOpenCvInitMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call ensureOpenCvInit() before the scanner is started (respects "no preload" gating)', () => {
    act(() => {
      useScannerStore.setState({ ...scannerStoreInitialState });
    });
    render(
      <ToastHost>
        <ScannerScreen />
      </ToastHost>,
    );

    // Still on the "Open scanner" button — `started` is false.
    expect(screen.getByTestId('open-scanner')).toBeTruthy();
    expect(ensureOpenCvInitMock).not.toHaveBeenCalled();
  });
});

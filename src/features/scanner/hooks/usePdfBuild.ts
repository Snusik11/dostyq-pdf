/**
 * `usePdfBuild` — builds the PDF in the background while the "done" screen is
 * open, so the exact file size can be shown BEFORE the user saves, and saving
 * is instant (the file already exists in memory).
 *
 * Restarts when `pages` changes and aborts the build in flight when the screen
 * goes away, so a closed screen never keeps rendering pages.
 */

import { useEffect, useState } from 'react';
import { buildPdf, type BuiltPdf } from '@/features/scanner/lib/exportPdf';
import type { DocumentPage } from '@/features/scanner/store/documentSlice';

export type PdfBuildState =
  | { readonly status: 'idle' }
  | { readonly status: 'building'; readonly done: number; readonly total: number }
  | { readonly status: 'ready'; readonly built: BuiltPdf }
  | { readonly status: 'error' };

const IDLE: PdfBuildState = { status: 'idle' };

export function usePdfBuild(pages: readonly DocumentPage[], enabled: boolean): PdfBuildState {
  const [state, setState] = useState<PdfBuildState>(IDLE);

  useEffect(() => {
    if (!enabled || pages.length === 0) {
      setState(IDLE);
      return undefined;
    }

    const controller = new AbortController();
    setState({ status: 'building', done: 0, total: pages.length });

    buildPdf(pages, {
      signal: controller.signal,
      onProgress: (done, total) => {
        if (!controller.signal.aborted) {
          setState({ status: 'building', done, total });
        }
      },
    })
      .then((built) => {
        if (!controller.signal.aborted) {
          setState(built ? { status: 'ready', built } : IDLE);
        }
      })
      .catch(() => {
        // An abort is the normal way this effect ends; anything else is a real failure.
        if (!controller.signal.aborted) {
          setState({ status: 'error' });
        }
      });

    return () => controller.abort();
  }, [pages, enabled]);

  return state;
}

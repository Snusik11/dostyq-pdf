import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encode } from 'jpeg-js';
import type { DocumentPage } from '@/features/scanner/store/documentSlice';
import type { EditRecipe } from '@/shared/types/scanner';
import { NEUTRAL_FILTER } from '@/shared/types/scanner';
import type { AspectRatioName, Point, Quad } from '@/shared/types/geometry';
import type { ApplyFilterResponse } from '@/features/scanner/worker/messages';
import { classifyPaperRatio, paperSelection } from '@/features/scanner/lib/paperFormats';

const decodeBlobToBitmapMock = vi.fn();
vi.mock('@/features/scanner/lib/pageResources', () => ({
  decodeBlobToBitmap: (...args: unknown[]) => decodeBlobToBitmapMock(...args),
}));

const applyFilterMock = vi.fn();
vi.mock('@/features/scanner/lib/workerClient', () => ({
  getSharedWorkerClient: () => ({
    applyFilter: (...args: unknown[]) => applyFilterMock(...args),
  }),
}));

const deliverPdfMock = vi.fn();
vi.mock('@/features/scanner/lib/savePdf', () => ({
  deliverPdf: (...args: unknown[]) => deliverPdfMock(...args),
}));

import {
  buildPdf,
  deliverBuiltPdf,
  exportFilename,
  exportPagesToPdf,
  PDF_JPEG_QUALITY,
  PDF_MAX_LONG_SIDE,
  renderPage,
} from '@/features/scanner/lib/exportPdf';

function makeBitmap(width: number, height: number): ImageBitmap & { close: ReturnType<typeof vi.fn> } {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap & { close: ReturnType<typeof vi.fn> };
}

function makeQuad(): Quad {
  const p = (x: number, y: number): Point => ({ x, y });
  return [p(0, 0), p(1, 0), p(1, 1), p(0, 1)];
}

function makeRecipe(overrides: Partial<EditRecipe> = {}): EditRecipe {
  return {
    corners: makeQuad(),
    paper: paperSelection('a4', 'auto'),
    aspectRatio: 'a4' as AspectRatioName,
    rotation: 0,
    flipH: false,
    flipV: false,
    filter: NEUTRAL_FILTER,
    ...overrides,
  };
}

function makePage(id: string, order: number, recipe: EditRecipe = makeRecipe()): DocumentPage {
  return {
    id,
    order,
    recipe,
    thumbnail: makeBitmap(150, 200),
    originalBlob: { id } as unknown as Blob,
    warpedBlob: { id } as unknown as Blob,
    originalWidth: 1000,
    originalHeight: 1400,
    warpedWidth: 1000,
    warpedHeight: 1400,
  };
}

function fakeApplyFilterResponse(bitmap: ImageBitmap): ApplyFilterResponse {
  return { id: 1, type: 'APPLY_FILTER_RESULT', results: [{ kind: 'bitmap', bitmap }] };
}

function installCanvasShims(): void {
  const fakeCtx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    filter: 'none',
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
  };
  const jpeg = encode({ data: Buffer.alloc(4), width: 1, height: 1 }, 80).data;
  const dataUrl = `data:image/jpeg;base64,${Buffer.from(jpeg).toString('base64')}`;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(dataUrl);
  vi.stubGlobal(
    'ImageData',
    class {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    },
  );
}

interface GeneratedPdf {
  output(type: 'arraybuffer'): ArrayBuffer;
  getNumberOfPages(): number;
}

function deliveredPdf(): GeneratedPdf {
  return deliverPdfMock.mock.calls[0]?.[0] as GeneratedPdf;
}

function mediaBoxesInPoints(pdf: GeneratedPdf): readonly [number, number][] {
  const bytes = new Uint8Array(pdf.output('arraybuffer'));
  const text = new TextDecoder('latin1').decode(bytes);
  return [...text.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((match) => [
    Number(match[1]),
    Number(match[2]),
  ] as const);
}

function expectMm(mediaBox: readonly [number, number], width: number, height: number): void {
  const pointsPerMm = 72 / 25.4;
  expect(mediaBox[0]).toBeCloseTo(width * pointsPerMm, 5);
  expect(mediaBox[1]).toBeCloseTo(height * pointsPerMm, 5);
}

describe('exportPagesToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installCanvasShims();
    deliverPdfMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('buildPdf / deliverBuiltPdf', () => {
    it('returns null for no pages', async () => {
      expect(await buildPdf([])).toBeNull();
    });

    it('builds the PDF without saving it and reports its exact size and page count', async () => {
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(100, 140));
      const built = await buildPdf([makePage('a', 0), makePage('b', 1)]);

      expect(deliverPdfMock).not.toHaveBeenCalled();
      expect(built?.pageCount).toBe(2);
      expect(built?.bytes).toBe(built?.doc.output('arraybuffer').byteLength);
      expect(built?.bytes).toBeGreaterThan(0);
    });

    it('reports progress after each page', async () => {
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(100, 140));
      const onProgress = vi.fn();
      await buildPdf([makePage('a', 0), makePage('b', 1), makePage('c', 2)], { onProgress });
      expect(onProgress.mock.calls).toEqual([
        [1, 3],
        [2, 3],
        [3, 3],
      ]);
    });

    it('rejects with an AbortError, and stops rendering, once the signal is aborted', async () => {
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(100, 140));
      const controller = new AbortController();
      const onProgress = vi.fn(() => controller.abort());
      await expect(
        buildPdf([makePage('a', 0), makePage('b', 1), makePage('c', 2)], { onProgress, signal: controller.signal }),
      ).rejects.toMatchObject({ name: 'AbortError' });
      expect(decodeBlobToBitmapMock).toHaveBeenCalledTimes(1);
    });

    it('saves an already built PDF under the conspect file name without rebuilding it', async () => {
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(100, 140));
      const built = await buildPdf([makePage('a', 0)]);
      expect(decodeBlobToBitmapMock).toHaveBeenCalledTimes(1);

      await deliverBuiltPdf(built!);

      expect(decodeBlobToBitmapMock).toHaveBeenCalledTimes(1);
      expect(deliverPdfMock).toHaveBeenCalledTimes(1);
      expect(deliverPdfMock.mock.calls[0]?.[0]).toBe(built?.doc);
      expect(deliverPdfMock.mock.calls[0]?.[1]).toMatch(/^conspect-\d{4}-\d{2}-\d{2}-\d{4}\.pdf$/);
    });
  });

  describe('size cap', () => {
    interface Encoded {
      readonly width: number;
      readonly height: number;
      readonly quality: unknown;
    }

    /** Records the canvas size and quality each time a page is encoded (the canvas is released right after, so it cannot be inspected later). */
    function captureEncodes(): Encoded[] {
      const encoded: Encoded[] = [];
      const dataUrl = HTMLCanvasElement.prototype.toDataURL('image/jpeg');
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (
        this: HTMLCanvasElement,
        _type?: string,
        quality?: unknown,
      ) {
        encoded.push({ width: this.width, height: this.height, quality });
        return dataUrl;
      });
      return encoded;
    }

    it('scales a landscape photo above the cap down to the cap and keeps the aspect ratio', async () => {
      const encoded = captureEncodes();
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(3686, 2765));
      const rendered = await renderPage(makePage('big', 0));
      expect(encoded).toEqual([{ width: 2000, height: 1500, quality: PDF_JPEG_QUALITY }]);
      expect(rendered.width).toBe(2000);
      expect(rendered.height).toBe(1500);
    });

    it('scales a portrait photo above the cap down by its long (vertical) side', async () => {
      const encoded = captureEncodes();
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(2765, 3686));
      await renderPage(makePage('tall', 0));
      expect(encoded[0]).toMatchObject({ width: 1500, height: 2000 });
    });

    it('measures the long side AFTER rotation, so a quarter turn does not change the cap', async () => {
      const encoded = captureEncodes();
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(3686, 2765));
      await renderPage(makePage('rot', 0, makeRecipe({ rotation: 90 })));
      expect(encoded[0]).toMatchObject({ width: 1500, height: 2000 });
    });

    it('leaves a page that already fits the cap at its own size', async () => {
      const encoded = captureEncodes();
      decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(1200, 1600));
      const rendered = await renderPage(makePage('small', 0));
      expect(encoded[0]).toMatchObject({ width: 1200, height: 1600 });
      expect(rendered.width).toBe(1200);
    });

    it('uses a long-side cap of 2000 px and a JPEG quality of 0.75 (measured on real notes, see exportPdf.ts)', () => {
      expect(PDF_MAX_LONG_SIDE).toBe(2000);
      expect(PDF_JPEG_QUALITY).toBe(0.75);
    });
  });

  it('names the file conspect-YYYY-MM-DD-HHmm.pdf from the local time', () => {
    expect(exportFilename(new Date(2026, 9, 19, 14, 32))).toBe('conspect-2026-10-19-1432.pdf');
    // Single-digit month, day, hour and minute are zero-padded.
    expect(exportFilename(new Date(2026, 0, 5, 7, 4))).toBe('conspect-2026-01-05-0704.pdf');
  });

  it('delivers the generated PDF under that file name', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(100, 140));
    await exportPagesToPdf([makePage('named', 0)]);
    expect(deliverPdfMock.mock.calls[0]?.[1]).toMatch(/^conspect-\d{4}-\d{2}-\d{2}-\d{4}\.pdf$/);
  });

  it('is a no-op when there are no pages', async () => {
    await exportPagesToPdf([]);
    expect(decodeBlobToBitmapMock).not.toHaveBeenCalled();
    expect(deliverPdfMock).not.toHaveBeenCalled();
  });

  it('processes pages sequentially in document order and closes every decoded bitmap', async () => {
    const bitmapA = makeBitmap(100, 140);
    const bitmapB = makeBitmap(200, 280);
    const bitmapC = makeBitmap(300, 420);
    decodeBlobToBitmapMock.mockResolvedValueOnce(bitmapA).mockResolvedValueOnce(bitmapB).mockResolvedValueOnce(bitmapC);
    const pageOrder2 = makePage('p-order-2', 2);
    const pageOrder0 = makePage('p-order-0', 0);
    const pageOrder1 = makePage('p-order-1', 1);

    await exportPagesToPdf([pageOrder2, pageOrder0, pageOrder1]);

    expect(decodeBlobToBitmapMock).toHaveBeenNthCalledWith(1, pageOrder0.warpedBlob);
    expect(decodeBlobToBitmapMock).toHaveBeenNthCalledWith(2, pageOrder1.warpedBlob);
    expect(decodeBlobToBitmapMock).toHaveBeenNthCalledWith(3, pageOrder2.warpedBlob);
    expect(bitmapA.close).toHaveBeenCalledTimes(1);
    expect(bitmapB.close).toHaveBeenCalledTimes(1);
    expect(bitmapC.close).toHaveBeenCalledTimes(1);
    expect(deliveredPdf().getNumberOfPages()).toBe(3);
  });

  it('routes worker-rendered presets through the worker while original remains raw', async () => {
    const originalBitmap = makeBitmap(100, 140);
    const enhancedBitmap = makeBitmap(100, 140);
    const filteredBitmap = makeBitmap(100, 140);
    decodeBlobToBitmapMock.mockResolvedValueOnce(originalBitmap).mockResolvedValueOnce(enhancedBitmap);
    applyFilterMock.mockResolvedValueOnce(fakeApplyFilterResponse(filteredBitmap));

    await exportPagesToPdf([
      makePage('p-original', 0, makeRecipe({ filter: { ...NEUTRAL_FILTER, preset: 'original' } })),
      makePage('p-enhanced', 1, makeRecipe({ filter: { ...NEUTRAL_FILTER, preset: 'enhanced' } })),
    ]);

    expect(applyFilterMock).toHaveBeenCalledTimes(1);
    expect(originalBitmap.close).toHaveBeenCalledTimes(1);
    expect(enhancedBitmap.close).toHaveBeenCalledTimes(1);
    expect(filteredBitmap.close).toHaveBeenCalledTimes(1);
  });

  it('writes the combined manual A4/A3 control canonical selection/value as a provisional 210 x 297 mm MediaBox', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(3024, 4032));
    await exportPagesToPdf([makePage('a4', 0, makeRecipe({ paper: paperSelection('a4', 'manual') }))]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 210, 297);
  });

  it('writes a manually selected landscape Tarjeta/DNI as a landscape ID-1 MediaBox', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(4032, 3024));
    await exportPagesToPdf([makePage('ticket', 0, makeRecipe({ paper: paperSelection('ticket', 'manual') }))]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 85.6, 53.98);
  });

  it('keeps automatic Ticket exports on raster MediaBox geometry', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(540, 1080));
    await exportPagesToPdf([makePage('ticket-auto', 0, makeRecipe({ paper: paperSelection('ticket', 'auto') }))]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 540 * (25.4 / 54), 1080 * (25.4 / 54));
  });

  it('keeps legacy Ticket exports on raster MediaBox geometry', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(540, 1080));
    await exportPagesToPdf([makePage('ticket-legacy', 0, makeRecipe({ paper: paperSelection('ticket', 'legacy') }))]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 540 * (25.4 / 54), 1080 * (25.4 / 54));
  });

  it('keeps automatic probabilistic A4 on raster geometry without claiming nominal millimeters', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(764, 540));
    await exportPagesToPdf([
      makePage('a4-probable', 0, makeRecipe({ paper: classifyPaperRatio(210 / 297) })),
    ]);

    const mediaBox = mediaBoxesInPoints(deliveredPdf())[0]!;
    expectMm(mediaBox, 764 * (25.4 / 54), 540 * (25.4 / 54));
    expect(mediaBox[0] / mediaBox[1]).toBeCloseTo(764 / 540, 5);
  });

  it('uses final rendered orientation for a landscape known format even when recipe rotation is zero', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(4032, 3024));
    await exportPagesToPdf([
      makePage('a4-landscape', 0, makeRecipe({ paper: paperSelection('a4', 'manual'), rotation: 0 })),
    ]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 297, 210);
  });

  it('rotates Letter MediaBox to landscape from recipe orientation', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(3024, 4032));
    await exportPagesToPdf([
      makePage('letter', 0, makeRecipe({ paper: paperSelection('letter', 'manual'), rotation: 90 })),
    ]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 279.4, 215.9);
  });

  it('writes the Oficio alias as the Legal-family 216 x 356 mm MediaBox', async () => {
    decodeBlobToBitmapMock.mockResolvedValue(makeBitmap(1200, 1800));
    await exportPagesToPdf([
      makePage('oficio', 0, makeRecipe({ paper: paperSelection('oficio', 'manual') })),
    ]);
    expectMm(mediaBoxesInPoints(deliveredPdf())[0]!, 216, 356);
  });

  it('keeps ordered MediaBoxes for mixed known nominal formats', async () => {
    decodeBlobToBitmapMock
      .mockResolvedValueOnce(makeBitmap(3000, 4200))
      .mockResolvedValueOnce(makeBitmap(3000, 4200))
      .mockResolvedValueOnce(makeBitmap(1800, 3000));
    await exportPagesToPdf([
      makePage('a4', 0, makeRecipe({ paper: paperSelection('a4', 'manual') })),
      makePage('letter', 1, makeRecipe({ paper: paperSelection('letter', 'auto'), rotation: 90 })),
      makePage('oficio', 2, makeRecipe({ paper: paperSelection('oficio', 'manual') })),
    ]);

    const mediaBoxes = mediaBoxesInPoints(deliveredPdf());
    expect(mediaBoxes).toHaveLength(3);
    expectMm(mediaBoxes[0]!, 210, 297);
    expectMm(mediaBoxes[1]!, 279.4, 215.9);
    expectMm(mediaBoxes[2]!, 216, 356);
  });

  it('keeps mixed known and legacy pages in one mm document with explicit raster fallback', async () => {
    decodeBlobToBitmapMock.mockResolvedValueOnce(makeBitmap(1000, 1400)).mockResolvedValueOnce(makeBitmap(540, 1080));
    await exportPagesToPdf([
      makePage('a4', 0, makeRecipe({ paper: paperSelection('a4', 'manual') })),
      makePage('original', 1, makeRecipe({ paper: paperSelection('original', 'legacy'), aspectRatio: 'unknown' })),
    ]);
    const mediaBoxes = mediaBoxesInPoints(deliveredPdf());
    expect(mediaBoxes).toHaveLength(2);
    expectMm(mediaBoxes[0]!, 210, 297);
    expectMm(mediaBoxes[1]!, 540 * (25.4 / 54), 1080 * (25.4 / 54));
  });
});

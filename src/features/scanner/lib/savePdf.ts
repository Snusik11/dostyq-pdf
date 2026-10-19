/**
 * Delivery of the generated PDF to the user.
 *
 * The app only runs in a browser (the Android/Capacitor shell of the upstream
 * Nitidoc project was removed in this fork), so delivery is a plain browser
 * download via `jsPDF.save()`.
 */

/**
 * The slice of jsPDF this module needs, declared structurally so nothing here
 * has to import jsPDF itself — it stays lazily loaded at its single call site
 * in `exportPdf.ts`.
 */
export interface PdfDocumentLike {
  save(filename: string): void;
}

/**
 * Hands the finished PDF to the browser as a download. Async so the caller's
 * contract (reject on failure so a toast can be shown) stays the same as
 * `exportPagesToPdf` already had.
 */
export async function deliverPdf(doc: PdfDocumentLike, filename: string): Promise<void> {
  doc.save(filename);
}

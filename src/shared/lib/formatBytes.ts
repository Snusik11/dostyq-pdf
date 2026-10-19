const BYTES_PER_MEGABYTE = 1024 * 1024;

/**
 * File size as a localized number of megabytes with one decimal ("11,1" in
 * Russian/Kazakh, "11.1" in English); the caller adds the unit through its own
 * translation. Megabytes are 1024 x 1024 bytes, the same unit the upload limit
 * is expressed in, so the number shown can be compared with the limit directly.
 * Anything under 0.1 MB reads "<0,1" instead of a misleading "0,0".
 */
export function formatMegabytes(bytes: number, locale: string): string {
  const format = (value: number): string =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  const megabytes = bytes / BYTES_PER_MEGABYTE;
  return megabytes < 0.1 ? `<${format(0.1)}` : format(megabytes);
}

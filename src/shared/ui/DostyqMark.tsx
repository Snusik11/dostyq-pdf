import type { ReactNode } from 'react';
import { DOSTYQ_MARK_PATH, DOSTYQ_MARK_VIEWBOX } from '@/shared/ui/dostyqMarkPath';

export interface DostyqMarkProps {
  /** Rendered height in pixels; the width follows the mark's aspect ratio. */
  readonly size?: number;
  readonly className?: string;
}

/**
 * The Dostyq logo mark (the book), drawn in `currentColor` so it takes the
 * surrounding text colour (e.g. `text-primary`). Purely decorative:
 * `aria-hidden`, callers provide their own accessible label.
 */
export function DostyqMark({ size = 28, className }: DostyqMarkProps): ReactNode {
  const { width, height } = DOSTYQ_MARK_VIEWBOX;
  return (
    <svg
      height={size}
      width={(size * width) / height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path fill="currentColor" fillRule="evenodd" d={DOSTYQ_MARK_PATH} />
    </svg>
  );
}

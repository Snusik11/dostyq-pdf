/**
 * Reorderable page list (design section 5.3, spec `document` Req "Grilla de
 * paginas con reorder"; Group 5 / PR8). One page per row, top to bottom: a
 * large preview so the order and legibility can be checked, with the drag
 * handle, edit and delete next to it. (It was a 3-column grid of small tiles.) Lazy-loaded feature boundary
 * (`React.lazy(() => import('./PageGrid'))` in `ScannerScreen`) so
 * `@dnd-kit` stays OUT of the initial bundle (F1's <200KB gzip budget,
 * design section 8). Replaces the inline `page-grid-placeholder`
 * `ScannerScreen` rendered before this PR.
 *
 * Renders every page ordered by `order` using its cached thumbnail (no
 * full-res recompute — D6). Tap a tile -> `onActivatePage` (caller wires
 * this into `useActivePage.activatePage`, design section 2.2). Trash icon ->
 * `onDeletePage` (Group 6 replaces the wired handler with
 * `usePageDeletion` + undo toast; for now the caller wires a minimal
 * `DocumentSlice.deletePage`). Drag-and-drop reorder -> `onDragEnd` computes
 * the FULL new id order and calls `onReorder` (spec scenario "Reorder por
 * drag-and-drop" — no partial patch, so `DocumentSlice.reorderPages` can
 * re-index densely).
 *
 * Fase 2.3 (capture-ux-redesign.md, Unit 5):
 *  - Empty state: `pages.length === 0` (every captured page skipped by the
 *    processing fallback or all deleted) renders a "Capturar" CTA instead of
 *    an empty/dead grid — reuses the same `onCaptureMore` -> `'capturing'`
 *    transition the populated grid's own button already wires.
 *  - `needsReview` badge: a tile whose page has `needsReview` (Unit 4's
 *    detect-fallback flag) shows a small badge so the user knows to
 *    double-check that page's corners before finishing.
 */

import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BackButton, Button } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { PageThumbnail } from '@/features/scanner/components/PageThumbnail';
import type { DocumentPage } from '@/features/scanner/store/documentSlice';

export interface PageGridProps {
  readonly pages: readonly DocumentPage[];
  readonly onActivatePage: (pageId: string) => void;
  readonly onDeletePage: (pageId: string) => void;
  /** onDragEnd hands the FULL new id order to the caller (spec scenario "Reorder por drag-and-drop"). */
  readonly onReorder: (orderedIds: readonly string[]) => void;
  readonly onCaptureMore: () => void;
  /**
   * Advances to the done screen, saving the document to the history on the way
   * (`ScannerScreen.handleGridFinish`). Labelled "Listo" rather than
   * "Finalizar" because this screen is a REVIEW step, not the end of anything.
   */
  readonly onFinish: () => void;
  /** Back to the adjust carousel (navigation-ux, bug 3). */
  readonly onBack: () => void;
}

/**
 * Pure reorder computation: moves `activeId` to the position `overId`
 * currently occupies, returning the FULL new id array (never a partial
 * patch). Returns the SAME array reference when either id is missing or
 * they are already equal, so callers can cheaply detect a no-op drag.
 */
export function reorderIds(
  ids: readonly string[],
  activeId: string,
  overId: string,
): readonly string[] {
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return ids;
  }
  const next = [...ids];
  // Non-null: `oldIndex` was already validated against `ids` above, so
  // `splice` always removes exactly one element here.
  const [moved] = next.splice(oldIndex, 1) as [string];
  next.splice(newIndex, 0, moved);
  return next;
}

export function PageGrid({
  pages,
  onActivatePage,
  onDeletePage,
  onReorder,
  onCaptureMore,
  onFinish,
  onBack,
}: PageGridProps): ReactNode {
  const { t } = useTranslation();
  // A bare `PointerSensor` with no activation constraint starts a drag on the
  // very first pointerdown anywhere on the tile — which captures the pointer
  // and SWALLOWS the `click` on the inner "tap-to-review" and trash buttons
  // (the reported "'Revisar' only tapped 1-in-100" + "delete never works"
  // bugs). Splitting into a MouseSensor with an 8px distance threshold (a tap
  // that never moves 8px is a click, not a drag) and a TouchSensor with a
  // 200ms long-press delay (a quick tap is a click; a short swipe scrolls the
  // grid; only a deliberate press-and-hold starts a reorder drag) makes both
  // inner buttons reliably tappable while keeping drag-to-reorder.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const ids = pages.map((page) => page.id);
      const next = reorderIds(ids, String(active.id), String(over.id));
      if (next !== ids) {
        onReorder(next);
      }
    },
    [pages, onReorder],
  );

  if (pages.length === 0) {
    // Unit 5 "Empty-state PageGrid": nothing to reorder/export/finish yet
    // (every raw capture was skipped by the processing fallback, or every
    // page since deleted) — a dead grid (0 tiles, disabled export, a
    // pointless "Finish") is worse than routing straight back to capture.
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4" data-testid="page-grid-empty">
        <Button type="button" variant="primary" onClick={onCaptureMore} data-testid="grid-empty-cta">
          {t('grid.emptyCta')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4" data-testid="page-grid">
      <div className="flex items-start gap-2">
        <BackButton onClick={onBack} testId="grid-back" className="mt-0.5" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-text">{t('grid.title')}</h1>
          <p className="text-sm text-text-muted">{t('grid.pageCount', { n: pages.length })}</p>
          <p className="text-xs text-text-muted/80">{t('grid.reorderHint')}</p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map((page) => page.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex w-full flex-col gap-3" data-testid="page-grid-list">
            {pages.map((page, index) => (
              <SortableGridItem
                key={page.id}
                page={page}
                index={index}
                onActivate={() => onActivatePage(page.id)}
                onDelete={() => onDeletePage(page.id)}
              />
            ))}
            {/* "+ Capturar más" row (design 5.3/5.5): a dashed pink row as the
                last item of the list. Keeps its `grid-capture-more` testid so the
                E2E flow still finds the re-arm control. */}
            <li className="list-none">
              <button
                type="button"
                onClick={onCaptureMore}
                data-testid="grid-capture-more"
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/45 bg-primary/5 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
              >
                <Plus size={24} strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-semibold">{t('grid.captureMore')}</span>
              </button>
            </li>
          </ul>
        </SortableContext>
      </DndContext>

      {/* Footer: a single "Listo", pinned to the bottom of the scroll area so
          it stays reachable. Clears the iOS home-indicator inset when
          installed as a PWA.

          "Exportar PDF" used to live here beside it, and its removal is the
          point: this screen is where you REVIEW — reorder, re-crop, delete the
          pages that came out wrong — not where you commit to an output. Two
          competing calls to action muddled that, and offering an export before
          the document was saved is what made a scan feel finished while it was
          still only in memory. One way out, and it is the one that saves. */}
      <div
        className="sticky bottom-0 flex w-full items-center gap-3 bg-bg/95 pt-3 backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <Button type="button" variant="primary" onClick={onFinish} data-testid="grid-finish" className="flex-1">
          {t('grid.finish')}
        </Button>
      </div>
    </div>
  );
}

// React.lazy requires a default export.
export default PageGrid;

interface SortableGridItemProps {
  readonly page: DocumentPage;
  /** Position in the ordered list — drives the numeric badge, the label and the staggered `rise` delay. */
  readonly index: number;
  readonly onActivate: () => void;
  readonly onDelete: () => void;
}

function SortableGridItem({ page, index, onActivate, onDelete }: SortableGridItemProps): ReactNode {
  const { t } = useTranslation();
  // Drag handle pattern (dnd-kit): the reorder listeners live on a dedicated
  // handle (`setActivatorNodeRef`), NOT the whole row. On touch/iOS, dragging
  // the entire row fought the list's own vertical scroll (and iOS fired the
  // long-press image/callout menu over the thumbnail canvas) — so reorder was
  // unreliable. A dedicated handle with `touch-action: none` (see the button
  // below) makes reorder deterministic while the rest of the row keeps normal
  // touch scrolling AND tap-to-edit.
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({
    id: page.id,
  });

  // A vertical list: a row only ever moves up or down, never sideways.
  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="relative" data-testid={`page-grid-item-${page.id}`}>
      {/* Inner wrapper carries the staggered `rise` entrance (design 5.5) and
          the row shadow. The dnd-kit reorder transform stays on the <li>
          above, so the entrance animation — which also drives `transform` —
          never fights the drag transform. */}
      <div
        className="animate-rise flex items-stretch gap-3 rounded-2xl border border-text/10 bg-surface p-2 shadow-[0_8px_22px_rgba(0,0,0,0.35)]"
        style={{ animationDelay: `${index * 70}ms` }}
      >
        {/* Preview. Tapping it opens the page editor. */}
        <div className="relative w-36 shrink-0">
          <button
            type="button"
            onClick={onActivate}
            className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
            data-testid={`page-grid-activate-${page.id}`}
          >
            <PageThumbnail
              bitmap={page.thumbnail}
              filter={page.recipe.filter}
              testId={`page-grid-thumb-${page.id}`}
              sizeClassName="aspect-[3/4] w-full"
            />
          </button>

          {/* Numeric order badge (design 5.5), top-left. */}
          <span
            className="absolute left-1 top-1 flex h-6 min-w-[24px] items-center justify-center rounded-md px-1 text-xs font-semibold tabular-nums text-white"
            style={{ backgroundColor: 'rgba(18,16,14,0.82)' }}
            aria-hidden="true"
          >
            {index + 1}
          </span>
        </div>

        {/* Title, "check this page" flag and the page actions. */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-base font-semibold text-text">{t('viewer.pageAlt', { n: index + 1 })}</span>
            {/* "Проверить" amber flag for pages the detect fallback couldn't
                auto-corner — opaque amber + dark text. */}
            {page.needsReview && (
              <span
                className="rounded-full bg-warning px-2 py-0.5 text-[11px] font-semibold text-bg"
                data-testid={`page-grid-review-badge-${page.id}`}
              >
                {t('grid.needsReview')}
              </span>
            )}
          </div>

          {/* Edit and delete. Both stop the sensor activation events so a press
              never starts a reorder drag: dnd-kit's MouseSensor activates on
              `mousedown` and TouchSensor on `touchstart`, so those are the events
              to stop — a `pointerdown` handler would NOT block them. A page that
              needs review shows an AMBER edit button + alert dot, so the same
              control both signals "check this one" and opens the editor. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onActivate();
              }}
              aria-label={page.needsReview ? t('grid.needsReview') : t('grid.editPage')}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-bg ring-1 ring-text/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light ${
                page.needsReview ? 'text-warning' : 'text-primary-light'
              }`}
              data-testid={`page-grid-edit-${page.id}`}
            >
              <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
              {page.needsReview && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-surface"
                  data-testid={`page-grid-review-dot-${page.id}`}
                  aria-hidden="true"
                />
              )}
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label={t('grid.deletePage')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-danger ring-1 ring-text/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              data-testid={`page-grid-delete-${page.id}`}
            >
              <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Drag handle — the ONLY reorder activator. `touch-action: none` (the
            `touch-none` class) lets a touch-drag start here without the list
            scrolling underneath, while the rest of the row keeps normal touch
            scroll + tap-to-edit. A SOLID dark pill with a pink ring and a white
            icon, so it shows on any page. */}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t('grid.reorder')}
          className="touch-none flex h-14 w-12 shrink-0 cursor-grab items-center justify-center self-center rounded-2xl bg-bg text-text shadow-[0_2px_10px_rgba(0,0,0,0.55)] ring-2 ring-primary active:cursor-grabbing focus-visible:outline-none focus-visible:ring-primary-light"
          data-testid={`page-grid-drag-${page.id}`}
        >
          <GripVertical size={26} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

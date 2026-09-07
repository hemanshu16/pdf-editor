import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { boxToScreen, screenToBox, normalizeRect, type ScreenRect } from '../../lib/geometry';
import type { Box } from '../../lib/types';
import styles from './RedactionOverlay.module.css';

const MIN_SIZE = 6;

type Corner = 'nw' | 'ne' | 'sw' | 'se';

type DragState =
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'move'; id: string; startBox: Box; startX: number; startY: number }
  | { kind: 'resize'; id: string; corner: Corner; startBox: Box };

const HANDLES: Corner[] = ['nw', 'ne', 'sw', 'se'];
const HANDLE_CLASS: Record<Corner, string> = {
  nw: styles.handleNw,
  ne: styles.handleNe,
  sw: styles.handleSw,
  se: styles.handleSe,
};

interface Props {
  pageNumber: number;
  zoom: number;
  baseWidth: number;
  baseHeight: number;
}

export default function RedactionOverlay({ pageNumber, zoom, baseHeight }: Props) {
  const redactions = useDocumentStore((s) => s.redactions[pageNumber] ?? []);
  const suggestions = useDocumentStore((s) => s.suggestions[pageNumber] ?? []);
  const selectedId = useDocumentStore((s) => s.selectedId);
  const setSelected = useDocumentStore((s) => s.setSelected);
  const addRedaction = useDocumentStore((s) => s.addRedaction);
  const updateRedactionLive = useDocumentStore((s) => s.updateRedactionLive);
  const removeRedaction = useDocumentStore((s) => s.removeRedaction);
  const acceptSuggestion = useDocumentStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useDocumentStore((s) => s.dismissSuggestion);
  const snapshot = useDocumentStore((s) => s.snapshot);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [draft, setDraft] = useState<ScreenRect | null>(null);

  const pointFromEvent = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { x, y } = pointFromEvent(e);

      if (drag.kind === 'draw') {
        setDraft(normalizeRect(drag.startX, drag.startY, x, y));
      } else if (drag.kind === 'move') {
        const dx = (x - drag.startX) / zoom;
        const dy = (y - drag.startY) / zoom;
        updateRedactionLive(pageNumber, drag.id, {
          x: drag.startBox.x + dx,
          y: drag.startBox.y - dy,
          width: drag.startBox.width,
          height: drag.startBox.height,
        });
      } else if (drag.kind === 'resize') {
        const start = boxToScreen(drag.startBox, baseHeight, zoom);
        let { left, top, width, height } = start;
        const right = left + width;
        const bottom = top + height;
        if (drag.corner === 'se') {
          width = Math.max(MIN_SIZE, x - left);
          height = Math.max(MIN_SIZE, y - top);
        } else if (drag.corner === 'sw') {
          width = Math.max(MIN_SIZE, right - x);
          left = right - width;
          height = Math.max(MIN_SIZE, y - top);
        } else if (drag.corner === 'ne') {
          width = Math.max(MIN_SIZE, x - left);
          height = Math.max(MIN_SIZE, bottom - y);
          top = bottom - height;
        } else {
          width = Math.max(MIN_SIZE, right - x);
          left = right - width;
          height = Math.max(MIN_SIZE, bottom - y);
          top = bottom - height;
        }
        updateRedactionLive(
          pageNumber,
          drag.id,
          screenToBox({ left, top, width, height }, baseHeight, zoom),
        );
      }
    },
    [baseHeight, pageNumber, pointFromEvent, updateRedactionLive, zoom],
  );

  const stopDragging = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDragging);
  }, [handlePointerMove]);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (drag?.kind === 'draw') {
        const { x, y } = pointFromEvent(e);
        const rect = normalizeRect(drag.startX, drag.startY, x, y);
        setDraft(null);
        if (rect.width >= MIN_SIZE && rect.height >= MIN_SIZE) {
          snapshot();
          addRedaction(pageNumber, screenToBox(rect, baseHeight, zoom));
        }
      }
      stopDragging();
    },
    [addRedaction, baseHeight, pageNumber, pointFromEvent, snapshot, stopDragging, zoom],
  );

  const beginDrag = useCallback(
    (drag: DragState) => {
      dragRef.current = drag;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (redactions.some((r) => r.id === selectedId)) {
          e.preventDefault();
          snapshot();
          removeRedaction(pageNumber, selectedId);
        }
      } else if (e.key === 'Escape') {
        setSelected(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pageNumber, redactions, removeRedaction, selectedId, setSelected, snapshot]);

  const onContainerPointerDown = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current) return;
    e.preventDefault();
    setSelected(null);
    const { x, y } = pointFromEvent(e);
    setDraft({ left: x, top: y, width: 0, height: 0 });
    beginDrag({ kind: 'draw', startX: x, startY: y });
  };

  const onBoxPointerDown = (e: React.PointerEvent, r: Box & { id: string }) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(r.id);
    const { x, y } = pointFromEvent(e);
    snapshot();
    beginDrag({ kind: 'move', id: r.id, startBox: r, startX: x, startY: y });
  };

  const onHandlePointerDown = (e: React.PointerEvent, r: Box & { id: string }, corner: Corner) => {
    e.stopPropagation();
    e.preventDefault();
    snapshot();
    beginDrag({ kind: 'resize', id: r.id, corner, startBox: r });
  };

  return (
    <div ref={containerRef} className={styles.overlay} onPointerDown={onContainerPointerDown}>
      {suggestions.map((s) => {
        const rect = boxToScreen(s, baseHeight, zoom);
        return (
          <div
            key={s.id}
            className={styles.suggestion}
            style={rect}
            onClick={(e) => {
              e.stopPropagation();
              acceptSuggestion(pageNumber, s.id);
            }}
            title={`Click to redact this ${s.label}`}
          >
            <span className={styles.suggestionTag}>{s.label}</span>
            <button
              type="button"
              className={styles.suggestionDismiss}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                dismissSuggestion(pageNumber, s.id);
              }}
              aria-label={`Dismiss suggested redaction: ${s.label}`}
            >
              ×
            </button>
          </div>
        );
      })}

      {redactions.map((r) => {
        const rect = boxToScreen(r, baseHeight, zoom);
        const selected = r.id === selectedId;
        return (
          <div
            key={r.id}
            className={`${styles.box} ${selected ? styles.boxSelected : ''}`}
            style={rect}
            onPointerDown={(e) => onBoxPointerDown(e, r)}
            role="button"
            tabIndex={0}
            aria-label={`Redaction, ${r.label}. Selected: ${selected ? 'yes' : 'no'}.`}
          >
            <div className={styles.boxFill} />
            {selected && (
              <>
                {HANDLES.map((corner) => (
                  <span
                    key={corner}
                    className={`${styles.handle} ${HANDLE_CLASS[corner]}`}
                    onPointerDown={(e) => onHandlePointerDown(e, r, corner)}
                  />
                ))}
                <button
                  type="button"
                  className={styles.remove}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    snapshot();
                    removeRedaction(pageNumber, r.id);
                  }}
                  aria-label="Remove this redaction"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      })}

      {draft && <div className={styles.draft} style={draft} />}
    </div>
  );
}

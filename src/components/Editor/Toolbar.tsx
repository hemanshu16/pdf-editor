import { useDocumentStore } from '../../store/useDocumentStore';
import styles from './Toolbar.module.css';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;

export default function Toolbar() {
  const currentPage = useDocumentStore((s) => s.currentPage);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const zoom = useDocumentStore((s) => s.zoom);
  const setZoom = useDocumentStore((s) => s.setZoom);
  const past = useDocumentStore((s) => s.past);
  const future = useDocumentStore((s) => s.future);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const scanningPage = useDocumentStore((s) => s.scanningPage);

  return (
    <footer className={styles.bar}>
      <div className={styles.group}>
        <button type="button" className={styles.iconButton} disabled={past.length === 0} onClick={undo} aria-label="Undo">
          ↺
        </button>
        <button type="button" className={styles.iconButton} disabled={future.length === 0} onClick={redo} aria-label="Redo">
          ↻
        </button>
      </div>

      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
          aria-label="Zoom out"
        >
          –
        </button>
        <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <div className={styles.group}>
        {scanningPage !== null && <span className={styles.scanning}>Scanning for sensitive text…</span>}
      </div>

      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className={styles.pageValue}>
          Page {currentPage} of {pageCount}
        </span>
        <button
          type="button"
          className={styles.iconButton}
          disabled={currentPage >= pageCount}
          onClick={() => setCurrentPage(currentPage + 1)}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </footer>
  );
}

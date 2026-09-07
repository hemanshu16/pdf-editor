import { useDocumentStore } from '../../store/useDocumentStore';
import styles from './TopBar.module.css';

export default function TopBar() {
  const fileName = useDocumentStore((s) => s.fileName);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const redactions = useDocumentStore((s) => s.redactions);
  const reset = useDocumentStore((s) => s.reset);
  const exportDocument = useDocumentStore((s) => s.exportDocument);
  const status = useDocumentStore((s) => s.status);

  const totalRedactions = Object.values(redactions).reduce((sum, list) => sum + list.length, 0);

  return (
    <header className={styles.bar}>
      <div className={styles.identity}>
        <span className={styles.wordmark}>
          <span className={styles.wordmarkBar} aria-hidden="true" />
          Redact
        </span>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.fileInfo}>
          {fileName} · {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>

      <div className={styles.actions}>
        {totalRedactions > 0 && <span className={styles.stamp}>● {totalRedactions} marked</span>}
        <button type="button" className={styles.ghostButton} onClick={reset}>
          Start over
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={status === 'exporting'}
          onClick={() => void exportDocument()}
        >
          Export PDF
        </button>
      </div>
    </header>
  );
}

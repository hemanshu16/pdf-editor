import { useDocumentStore } from '../../store/useDocumentStore';
import styles from './ExportOverlay.module.css';

export default function ExportOverlay() {
  const progress = useDocumentStore((s) => s.exportProgress);
  const pct = progress && progress.total > 0 ? Math.round((progress.page / progress.total) * 100) : 0;

  return (
    <div className={styles.scrim} role="status" aria-live="polite">
      <div className={styles.card}>
        <p className={styles.label}>Flattening pages…</p>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.detail}>
          {progress ? `Page ${progress.page} of ${progress.total}` : 'Starting…'}
        </p>
      </div>
    </div>
  );
}

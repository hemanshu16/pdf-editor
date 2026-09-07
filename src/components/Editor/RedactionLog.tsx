import { useDocumentStore } from '../../store/useDocumentStore';
import { maskSample } from '../../lib/mask';
import { EMPTY_ARRAY } from '../../lib/emptyArray';
import styles from './RedactionLog.module.css';

export default function RedactionLog() {
  const currentPage = useDocumentStore((s) => s.currentPage);
  const redactions = useDocumentStore((s) => s.redactions[currentPage] ?? EMPTY_ARRAY);
  const suggestions = useDocumentStore((s) => s.suggestions[currentPage] ?? EMPTY_ARRAY);
  const removeRedaction = useDocumentStore((s) => s.removeRedaction);
  const setSelected = useDocumentStore((s) => s.setSelected);
  const selectedId = useDocumentStore((s) => s.selectedId);
  const acceptSuggestion = useDocumentStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useDocumentStore((s) => s.dismissSuggestion);
  const snapshot = useDocumentStore((s) => s.snapshot);

  return (
    <aside className={styles.log} aria-label="Redaction log">
      <div className={styles.header}>
        <h2 className={styles.title}>Redaction Log</h2>
        <span className={styles.pageTag}>page {currentPage}</span>
      </div>

      <div className={styles.section}>
        {redactions.length === 0 ? (
          <p className={styles.empty}>
            Nothing marked on this page yet. Drag a box over the canvas, or accept a match below.
          </p>
        ) : (
          <ul className={styles.entries}>
            {redactions.map((r, i) => (
              <li
                key={r.id}
                className={`${styles.entry} ${r.id === selectedId ? styles.entryActive : ''}`}
                onClick={() => setSelected(r.id)}
              >
                <span className={styles.entryId}>R-{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.entryLabel}>{r.label}</span>
                <span className={styles.entryDims}>
                  {Math.round(r.width)}×{Math.round(r.height)}pt
                </span>
                <button
                  type="button"
                  className={styles.entryRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapshot();
                    removeRedaction(currentPage, r.id);
                  }}
                  aria-label={`Remove redaction R-${i + 1}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.subtitle}>Smart Detect found {suggestions.length}</h3>
          <ul className={styles.suggestList}>
            {suggestions.map((s) => (
              <li key={s.id} className={styles.suggestEntry}>
                <div className={styles.suggestText}>
                  <span className={styles.suggestLabel}>{s.label}</span>
                  <span className={styles.suggestSample}>{maskSample(s.sample)}</span>
                </div>
                <div className={styles.suggestActions}>
                  <button
                    type="button"
                    className={styles.acceptButton}
                    onClick={() => acceptSuggestion(currentPage, s.id)}
                  >
                    Redact
                  </button>
                  <button
                    type="button"
                    className={styles.dismissButton}
                    onClick={() => dismissSuggestion(currentPage, s.id)}
                  >
                    Ignore
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.footnote}>
        Export flattens every page to an image with your boxes burned in — the covered text can&apos;t
        be recovered by selecting or copying it.
      </p>
    </aside>
  );
}

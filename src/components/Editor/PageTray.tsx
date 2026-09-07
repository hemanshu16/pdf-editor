import { useDocumentStore } from '../../store/useDocumentStore';
import Thumb from './Thumb';
import styles from './PageTray.module.css';

export default function PageTray() {
  const pageCount = useDocumentStore((s) => s.pageCount);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const redactions = useDocumentStore((s) => s.redactions);

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className={styles.tray} aria-label="Pages">
      {pages.map((n) => {
        const count = redactions[n]?.length ?? 0;
        const active = n === currentPage;
        return (
          <button
            key={n}
            type="button"
            className={`${styles.item} ${active ? styles.itemActive : ''}`}
            onClick={() => setCurrentPage(n)}
            aria-current={active}
          >
            <span className={styles.thumbFrame}>
              <Thumb pageNumber={n} />
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </span>
            <span className={styles.pageNumber}>{n}</span>
          </button>
        );
      })}
    </nav>
  );
}

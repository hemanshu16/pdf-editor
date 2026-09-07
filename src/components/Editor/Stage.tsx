import { useEffect, useState } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import PdfCanvas from './PdfCanvas';
import RedactionOverlay from './RedactionOverlay';
import styles from './Stage.module.css';

export default function Stage() {
  const currentPage = useDocumentStore((s) => s.currentPage);
  const zoom = useDocumentStore((s) => s.zoom);
  const ensurePageSize = useDocumentStore((s) => s.ensurePageSize);
  const [base, setBase] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBase(null);
    void ensurePageSize(currentPage).then((size) => {
      if (!cancelled) setBase(size);
    });
    return () => {
      cancelled = true;
    };
  }, [currentPage, ensurePageSize]);

  return (
    <div className={styles.viewport}>
      {base ? (
        <div
          className={styles.page}
          style={{ width: base.width * zoom, height: base.height * zoom }}
        >
          <PdfCanvas pageNumber={currentPage} zoom={zoom} />
          <RedactionOverlay
            pageNumber={currentPage}
            zoom={zoom}
            baseWidth={base.width}
            baseHeight={base.height}
          />
        </div>
      ) : (
        <div className={styles.skeleton} aria-hidden="true" />
      )}
    </div>
  );
}

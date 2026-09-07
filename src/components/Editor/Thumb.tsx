import { useEffect, useRef } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { getPage } from '../../pdf/pageCache';
import styles from './PageTray.module.css';

const THUMB_WIDTH = 120;

export default function Thumb({ pageNumber }: { pageNumber: number }) {
  const pdfDoc = useDocumentStore((s) => s.pdfDoc);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await getPage(pdfDoc, pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = THUMB_WIDTH / base.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      try {
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch {
        // page navigated away mid-render; ignore
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return <canvas ref={canvasRef} className={styles.thumbCanvas} />;
}

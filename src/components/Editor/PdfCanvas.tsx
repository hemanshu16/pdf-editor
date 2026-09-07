import { useEffect, useRef } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { getPage } from '../../pdf/pageCache';
import styles from './Stage.module.css';

interface CancellableTask {
  promise: Promise<unknown>;
  cancel: () => void;
}

export default function PdfCanvas({ pageNumber, zoom }: { pageNumber: number; zoom: number }) {
  const pdfDoc = useDocumentStore((s) => s.pdfDoc);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<CancellableTask | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await getPage(pdfDoc, pageNumber);
      if (cancelled) return;

      const outputScale = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: zoom * outputScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${viewport.width / outputScale}px`;
      canvas.style.height = `${viewport.height / outputScale}px`;

      taskRef.current?.cancel();
      const task = page.render({ canvasContext: ctx, viewport, canvas }) as unknown as CancellableTask;
      taskRef.current = task;
      try {
        await task.promise;
      } catch (err) {
        const name = (err as { name?: string })?.name;
        if (name !== 'RenderingCancelledException') console.error(err);
      }
    }

    void render();
    return () => {
      cancelled = true;
      taskRef.current?.cancel();
    };
  }, [pdfDoc, pageNumber, zoom]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

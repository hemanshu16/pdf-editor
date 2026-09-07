import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getPage } from '../pdf/pageCache';
import type { Redaction } from './types';

const TARGET_SCALE = 2;
const MAX_DIMENSION = 3200;
const REDACTION_COLOR = '#000000';

export interface ExportOptions {
  pdfDoc: PDFDocumentProxy;
  pageCount: number;
  redactions: Record<number, Redaction[]>;
  fileName: string;
  onProgress?: (page: number, total: number) => void;
}

function outputFileName(original: string): string {
  const base = original.replace(/\.pdf$/i, '') || 'document';
  return `${base}-redacted.pdf`;
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Rebuilds the PDF from scratch as one flattened image per page, with redaction
 * boxes burned into the raster before encoding. Nothing from the source
 * document — text layer, metadata, hidden layers, attachments — carries over,
 * so text sitting under a redaction box cannot be recovered by selecting or
 * extracting it.
 */
export async function exportRedactedPdf({
  pdfDoc,
  pageCount,
  redactions,
  fileName,
  onProgress,
}: ExportOptions): Promise<void> {
  const outDoc = await PDFLibDocument.create();

  for (let n = 1; n <= pageCount; n++) {
    const page = await getPage(pdfDoc, n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(TARGET_SCALE, MAX_DIMENSION / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    ctx.fillStyle = REDACTION_COLOR;
    for (const box of redactions[n] ?? []) {
      const px = box.x * scale;
      const py = (base.height - box.y - box.height) * scale;
      ctx.fillRect(px, py, box.width * scale, box.height * scale);
    }

    const pngBytes = await canvasToPngBytes(canvas);
    const image = await outDoc.embedPng(pngBytes);
    const outPage = outDoc.addPage([base.width, base.height]);
    outPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });

    onProgress?.(n, pageCount);
  }

  const bytes = await outDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = outputFileName(fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

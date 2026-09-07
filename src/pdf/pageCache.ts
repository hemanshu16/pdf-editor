import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

const cache = new WeakMap<PDFDocumentProxy, Map<number, Promise<PDFPageProxy>>>();

export function getPage(doc: PDFDocumentProxy, pageNumber: number): Promise<PDFPageProxy> {
  let perDoc = cache.get(doc);
  if (!perDoc) {
    perDoc = new Map();
    cache.set(doc, perDoc);
  }
  let page = perDoc.get(pageNumber);
  if (!page) {
    page = doc.getPage(pageNumber);
    perDoc.set(pageNumber, page);
  }
  return page;
}

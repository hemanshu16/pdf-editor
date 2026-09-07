import { create } from 'zustand';
import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import '../pdf/pdfWorker';
import { getPage } from '../pdf/pageCache';
import { scanPageForSensitiveText } from '../lib/textScan';
import { exportRedactedPdf } from '../lib/exportRedactedPdf';
import type { Box, DocStatus, Redaction, Suggestion } from '../lib/types';

interface Snapshot {
  redactions: Record<number, Redaction[]>;
  suggestions: Record<number, Suggestion[]>;
}

interface DocumentState {
  status: DocStatus;
  errorMessage: string | null;
  fileName: string;
  pdfDoc: PDFDocumentProxy | null;
  pageCount: number;
  pageSizes: Record<number, { width: number; height: number }>;
  currentPage: number;
  zoom: number;
  selectedId: string | null;
  scanningPage: number | null;
  redactions: Record<number, Redaction[]>;
  suggestions: Record<number, Suggestion[]>;
  past: Snapshot[];
  future: Snapshot[];
  exportProgress: { page: number; total: number } | null;

  loadFile: (file: File) => Promise<void>;
  reset: () => void;
  setCurrentPage: (n: number) => void;
  setZoom: (z: number | ((z: number) => number)) => void;
  setSelected: (id: string | null) => void;
  exportDocument: () => Promise<void>;
  ensurePageSize: (page: number) => Promise<{ width: number; height: number }>;
  scanPage: (page: number) => Promise<void>;

  snapshot: () => void;
  addRedaction: (page: number, box: Box, label?: string) => string;
  updateRedactionLive: (page: number, id: string, box: Box) => void;
  removeRedaction: (page: number, id: string) => void;
  acceptSuggestion: (page: number, id: string) => void;
  dismissSuggestion: (page: number, id: string) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

function cloneMap<T>(map: Record<number, T[]>): Record<number, T[]> {
  const out: Record<number, T[]> = {};
  for (const key of Object.keys(map)) {
    out[Number(key)] = [...map[Number(key)]];
  }
  return out;
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const initial = {
  status: 'empty' as DocStatus,
  errorMessage: null,
  fileName: '',
  pdfDoc: null,
  pageCount: 0,
  pageSizes: {},
  currentPage: 1,
  zoom: 1,
  selectedId: null,
  scanningPage: null,
  redactions: {},
  suggestions: {},
  past: [],
  future: [],
  exportProgress: null,
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...initial,

  async loadFile(file) {
    set({ status: 'loading', errorMessage: null, fileName: file.name });
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await getDocument({ data: buf }).promise;
      set({
        ...initial,
        status: 'ready',
        fileName: file.name,
        pdfDoc,
        pageCount: pdfDoc.numPages,
        currentPage: 1,
      });
      void get().scanPage(1);
    } catch (err) {
      console.error(err);
      set({
        status: 'error',
        errorMessage:
          'This file could not be opened. Make sure it is a valid, unencrypted PDF.',
      });
    }
  },

  reset() {
    set({ ...initial });
  },

  setCurrentPage(n) {
    const { pageCount } = get();
    const page = Math.min(Math.max(1, n), Math.max(1, pageCount));
    set({ currentPage: page, selectedId: null });
    void get().scanPage(page);
  },

  setZoom(z) {
    set((s) => ({ zoom: typeof z === 'function' ? z(s.zoom) : z }));
  },

  setSelected(id) {
    set({ selectedId: id });
  },

  async ensurePageSize(pageNumber) {
    const existing = get().pageSizes[pageNumber];
    if (existing) return existing;
    const { pdfDoc } = get();
    if (!pdfDoc) return { width: 612, height: 792 };
    const page = await getPage(pdfDoc, pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const size = { width: viewport.width, height: viewport.height };
    set((s) => ({ pageSizes: { ...s.pageSizes, [pageNumber]: size } }));
    return size;
  },

  async scanPage(pageNumber) {
    const { pdfDoc, suggestions, redactions } = get();
    if (!pdfDoc) return;
    if (suggestions[pageNumber] || redactions[pageNumber]?.some((r) => r.source === 'smart-detect')) {
      return;
    }
    set({ scanningPage: pageNumber });
    try {
      const page = await getPage(pdfDoc, pageNumber);
      const matches = await scanPageForSensitiveText(page);
      const existing = get().redactions[pageNumber] ?? [];
      const found: Suggestion[] = matches
        .filter(
          (m) =>
            !existing.some(
              (r) => Math.abs(r.x - m.x) < 1 && Math.abs(r.y - m.y) < 1,
            ),
        )
        .map((m) => ({
          id: makeId(),
          page: pageNumber,
          x: m.x,
          y: m.y,
          width: m.width,
          height: m.height,
          label: m.label,
          sample: m.sample,
        }));
      set((s) => ({
        suggestions: { ...s.suggestions, [pageNumber]: found },
        scanningPage: s.scanningPage === pageNumber ? null : s.scanningPage,
      }));
    } catch (err) {
      console.error('Smart Detect scan failed for page', pageNumber, err);
      set({ scanningPage: null });
    }
  },

  snapshot() {
    const { redactions, suggestions, past } = get();
    const entry: Snapshot = { redactions: cloneMap(redactions), suggestions: cloneMap(suggestions) };
    const nextPast = [...past, entry].slice(-MAX_HISTORY);
    set({ past: nextPast, future: [] });
  },

  addRedaction(page, box, label = 'manual box') {
    const id = makeId();
    const redaction: Redaction = { id, page, label, source: 'manual', ...box };
    set((s) => ({
      redactions: { ...s.redactions, [page]: [...(s.redactions[page] ?? []), redaction] },
      selectedId: id,
    }));
    return id;
  },

  updateRedactionLive(page, id, box) {
    set((s) => ({
      redactions: {
        ...s.redactions,
        [page]: (s.redactions[page] ?? []).map((r) => (r.id === id ? { ...r, ...box } : r)),
      },
    }));
  },

  removeRedaction(page, id) {
    set((s) => ({
      redactions: {
        ...s.redactions,
        [page]: (s.redactions[page] ?? []).filter((r) => r.id !== id),
      },
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  acceptSuggestion(page, id) {
    const { suggestions } = get();
    const s = suggestions[page]?.find((x) => x.id === id);
    if (!s) return;
    get().snapshot();
    const redaction: Redaction = {
      id: s.id,
      page,
      label: s.label,
      source: 'smart-detect',
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
    };
    set((state) => ({
      redactions: { ...state.redactions, [page]: [...(state.redactions[page] ?? []), redaction] },
      suggestions: {
        ...state.suggestions,
        [page]: (state.suggestions[page] ?? []).filter((x) => x.id !== id),
      },
    }));
  },

  dismissSuggestion(page, id) {
    set((s) => ({
      suggestions: {
        ...s.suggestions,
        [page]: (s.suggestions[page] ?? []).filter((x) => x.id !== id),
      },
    }));
  },

  async exportDocument() {
    const { pdfDoc, pageCount, redactions, fileName } = get();
    if (!pdfDoc) return;
    set({ status: 'exporting', exportProgress: { page: 0, total: pageCount } });
    try {
      await exportRedactedPdf({
        pdfDoc,
        pageCount,
        redactions,
        fileName,
        onProgress: (page, total) => set({ exportProgress: { page, total } }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ status: 'ready', exportProgress: null });
    }
  },

  undo() {
    const { past, redactions, suggestions } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const currentSnapshot: Snapshot = { redactions: cloneMap(redactions), suggestions: cloneMap(suggestions) };
    set((s) => ({
      redactions: previous.redactions,
      suggestions: previous.suggestions,
      past: past.slice(0, -1),
      future: [...s.future, currentSnapshot].slice(-MAX_HISTORY),
      selectedId: null,
    }));
  },

  redo() {
    const { future, redactions, suggestions } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const currentSnapshot: Snapshot = { redactions: cloneMap(redactions), suggestions: cloneMap(suggestions) };
    set((s) => ({
      redactions: next.redactions,
      suggestions: next.suggestions,
      future: future.slice(0, -1),
      past: [...s.past, currentSnapshot].slice(-MAX_HISTORY),
      selectedId: null,
    }));
  },
}));

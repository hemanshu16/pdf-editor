// All geometry lives in raw PDF page space: origin bottom-left, y-up, in points.
// This is pdf-lib's native space, so redaction boxes need no conversion at export time.
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Redaction extends Box {
  id: string;
  page: number;
  label: string;
  source: 'manual' | 'smart-detect';
}

export interface Suggestion extends Box {
  id: string;
  page: number;
  label: string;
  sample: string;
}

export type DocStatus = 'empty' | 'loading' | 'ready' | 'exporting' | 'error';

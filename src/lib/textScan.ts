import type { PDFPageProxy } from 'pdfjs-dist';
import { findSensitiveSpans } from './sensitivePatterns';
import type { Box } from './types';

interface RawTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

function hasStr(item: unknown): item is RawTextItem {
  return typeof item === 'object' && item !== null && 'str' in item && 'transform' in item;
}

interface PositionedItem {
  box: Box;
  charStart: number;
  charEnd: number;
}

interface Line {
  text: string;
  items: PositionedItem[];
}

const LINE_TOLERANCE = 2;
const SPACE_GAP_RATIO = 0.15;

function itemBox(item: RawTextItem): Box {
  const [, b, , d, x, yBaseline] = item.transform;
  const h = item.height || Math.hypot(item.transform[2], item.transform[3]) || Math.abs(d) || 10;
  void b;
  return {
    x,
    y: yBaseline - h * 0.28,
    width: item.width || 0,
    height: h * 1.2,
  };
}

function groupLines(items: RawTextItem[]): Line[] {
  const withBox = items
    .filter((it) => it.str.length > 0)
    .map((it) => ({ item: it, box: itemBox(it) }))
    .sort((a, b) => {
      const dy = b.box.y - a.box.y;
      if (Math.abs(dy) > LINE_TOLERANCE) return dy;
      return a.box.x - b.box.x;
    });

  const grouped: { y: number; entries: typeof withBox }[] = [];
  for (const entry of withBox) {
    const last = grouped[grouped.length - 1];
    if (last && Math.abs(entry.box.y - last.y) <= LINE_TOLERANCE) {
      last.entries.push(entry);
    } else {
      grouped.push({ y: entry.box.y, entries: [entry] });
    }
  }

  return grouped.map(({ entries }) => {
    let text = '';
    const positioned: PositionedItem[] = [];
    let prevRight: number | null = null;
    for (const { item, box } of entries) {
      if (prevRight !== null) {
        const gap = box.x - prevRight;
        if (gap > box.height * SPACE_GAP_RATIO) text += ' ';
      }
      const charStart = text.length;
      text += item.str;
      positioned.push({ box, charStart, charEnd: text.length });
      prevRight = box.x + box.width;
    }
    return { text, items: positioned };
  });
}

function unionBoxes(boxes: Box[]): Box {
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.width));
  const y1 = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

export interface ScannedMatch extends Box {
  label: string;
  sample: string;
}

export async function scanPageForSensitiveText(page: PDFPageProxy): Promise<ScannedMatch[]> {
  const content = await page.getTextContent();
  const items = content.items.filter(hasStr);
  const lines = groupLines(items);

  const results: ScannedMatch[] = [];
  for (const line of lines) {
    const spans = findSensitiveSpans(line.text);
    for (const span of spans) {
      const covering = line.items.filter(
        (it) => it.charStart < span.end && it.charEnd > span.start,
      );
      if (covering.length === 0) continue;
      const box = unionBoxes(covering.map((c) => c.box));
      results.push({ ...box, label: span.label, sample: span.sample });
    }
  }
  return results;
}

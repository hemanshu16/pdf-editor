import type { Box } from './types';

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** PDF box space (bottom-left origin, y-up, points) -> on-screen CSS px (top-left origin). */
export function boxToScreen(box: Box, baseHeight: number, zoom: number): ScreenRect {
  return {
    left: box.x * zoom,
    top: (baseHeight - box.y - box.height) * zoom,
    width: box.width * zoom,
    height: box.height * zoom,
  };
}

/** On-screen CSS px rect -> PDF box space. */
export function screenToBox(rect: ScreenRect, baseHeight: number, zoom: number): Box {
  return {
    x: rect.left / zoom,
    y: baseHeight - rect.top / zoom - rect.height / zoom,
    width: rect.width / zoom,
    height: rect.height / zoom,
  };
}

export function normalizeRect(x0: number, y0: number, x1: number, y1: number): ScreenRect {
  return {
    left: Math.min(x0, x1),
    top: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}

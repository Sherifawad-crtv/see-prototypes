import type { Area } from './types.ts';

/** The opponent half is 10 m wide and 10 m deep. */
export const HALF_METRES = 10;
export const MIN_AREA = 0.06;
export const TAP_AREA = { w: 0.3, h: 0.25 };

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

export function inArea(area: Area, x: number, y: number): boolean {
  return x >= area.x0 && x <= area.x1 && y >= area.y0 && y <= area.y1;
}

export function areaCentre(area: Area): { x: number; y: number } {
  return { x: (area.x0 + area.x1) / 2, y: (area.y0 + area.y1) / 2 };
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function areaFrom(a: { x: number; y: number }, b: { x: number; y: number }): Area {
  return {
    x0: Math.min(a.x, b.x),
    y0: Math.min(a.y, b.y),
    x1: Math.max(a.x, b.x),
    y1: Math.max(a.y, b.y),
  };
}

export function areaAround(centre: { x: number; y: number }): Area {
  const x0 = Math.min(1 - TAP_AREA.w, Math.max(0, centre.x - TAP_AREA.w / 2));
  const y0 = Math.min(1 - TAP_AREA.h, Math.max(0, centre.y - TAP_AREA.h / 2));
  return { x0, y0, x1: x0 + TAP_AREA.w, y1: y0 + TAP_AREA.h };
}

export function areaLabel(area: Area): string {
  const width = ((area.x1 - area.x0) * HALF_METRES).toFixed(1);
  const depth = ((area.y1 - area.y0) * HALF_METRES).toFixed(1);
  return `${width} × ${depth} m`;
}

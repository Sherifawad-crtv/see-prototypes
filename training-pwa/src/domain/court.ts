import type { Cone, Zone } from './types.ts';

/** The opponent half is 10 m wide and 10 m deep. */
export const HALF_METRES = 10;
/** From this many cones on, the cones are joined into a shape. */
export const ZONE_MIN_CONES = 3;
export const MAX_ZONES = 4;
export const MAX_CONES_PER_ZONE = 8;
export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function isComplete(zone: Zone): boolean {
  return zone.length >= ZONE_MIN_CONES;
}

/** Cones ordered around their centre, so joining them in order never crosses itself. */
export function polygonOf(zone: Zone): Cone[] {
  const cx = zone.reduce((sum, cone) => sum + cone.x, 0) / zone.length;
  const cy = zone.reduce((sum, cone) => sum + cone.y, 0) / zone.length;
  return [...zone].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
}

export function polygonsOf(zones: Zone[]): Cone[][] {
  return zones.filter(isComplete).map(polygonOf);
}

export function centreOf(shape: Cone[]): Cone {
  return {
    x: shape.reduce((sum, cone) => sum + cone.x, 0) / shape.length,
    y: shape.reduce((sum, cone) => sum + cone.y, 0) / shape.length,
  };
}

function inShape(shape: Cone[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const a = shape[i];
    const b = shape[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function inZones(zones: Zone[], x: number, y: number): boolean {
  return polygonsOf(zones).some((shape) => inShape(shape, x, y));
}

function areaOf(shape: Cone[]): number {
  let sum = 0;
  for (let i = 0; i < shape.length; i++) {
    const a = shape[i];
    const b = shape[(i + 1) % shape.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Ready to use: at least one closed zone and no half-finished one. */
export function zonesReady(zones: Zone[]): boolean {
  const filled = zones.filter((zone) => zone.length > 0);
  return filled.length > 0 && filled.every(isComplete);
}

export function zonesLabel(zones: Zone[]): string {
  const shapes = polygonsOf(zones);
  if (shapes.length === 1) return `${Math.max(1, Math.round(areaOf(shapes[0]) * HALF_METRES * HALF_METRES))} m² zone`;
  return `${shapes.length} zones`;
}

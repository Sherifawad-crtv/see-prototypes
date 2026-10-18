import type { Cone, Zone } from './types.ts';

/** The opponent half is 10 m wide and 10 m deep. */
export const HALF_METRES = 10;
/** A zone gets its circle once it holds more than 3 cones. */
export const ZONE_MIN_CONES = 4;
export const MAX_ZONES = 4;
export const MAX_CONES_PER_ZONE = 8;
const ZONE_PAD = 0.05;

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function isComplete(zone: Zone): boolean {
  return zone.length >= ZONE_MIN_CONES;
}

export function circleOf(zone: Zone): Circle {
  const xs = zone.map((cone) => cone.x);
  const ys = zone.map((cone) => cone.y);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  const r = Math.max(...zone.map((cone: Cone) => Math.hypot(cone.x - x, cone.y - y))) + ZONE_PAD;
  return { x, y, r };
}

export function circlesOf(zones: Zone[]): Circle[] {
  return zones.filter(isComplete).map(circleOf);
}

export function inZones(zones: Zone[], x: number, y: number): boolean {
  return circlesOf(zones).some((c) => Math.hypot(x - c.x, y - c.y) <= c.r);
}

/** Ready to use: at least one zone with a circle and no half-finished zone. */
export function zonesReady(zones: Zone[]): boolean {
  const filled = zones.filter((zone) => zone.length > 0);
  return filled.length > 0 && filled.every(isComplete);
}

export function zonesLabel(zones: Zone[]): string {
  const circles = circlesOf(zones);
  if (circles.length === 1) return `${(circles[0].r * 2 * HALF_METRES).toFixed(1)} m zone`;
  return `${circles.length} zones`;
}

import type { ZoneId } from './types.ts';

export interface Zone {
  id: ZoneId;
  label: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cx: number;
  cy: number;
}

const ROWS = [
  { name: 'front', label: 'Front', y0: 0, y1: 0.35 },
  { name: 'mid', label: 'Mid', y0: 0.35, y1: 0.695 },
  { name: 'back', label: 'Back', y0: 0.695, y1: 1 },
] as const;

const COLUMNS = [
  { name: 'left', label: 'left', x0: 0, x1: 0.5 },
  { name: 'right', label: 'right', x0: 0.5, x1: 1 },
] as const;

export const ZONES: Zone[] = ROWS.flatMap((row) =>
  COLUMNS.map((col) => ({
    id: `${row.name}-${col.name}` as ZoneId,
    label: `${row.label} ${col.label}`,
    x0: col.x0,
    x1: col.x1,
    y0: row.y0,
    y1: row.y1,
    cx: (col.x0 + col.x1) / 2,
    cy: (row.y0 + row.y1) / 2,
  })),
);

const BY_ID = new Map(ZONES.map((z) => [z.id, z]));

export function getZone(id: ZoneId): Zone {
  const zone = BY_ID.get(id);
  if (!zone) throw new Error(`Unknown zone: ${id}`);
  return zone;
}

export function zoneAt(x: number, y: number): ZoneId | null {
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  const col = x < 0.5 ? 'left' : 'right';
  const row = y < 0.35 ? 'front' : y < 0.695 ? 'mid' : 'back';
  return `${row}-${col}` as ZoneId;
}

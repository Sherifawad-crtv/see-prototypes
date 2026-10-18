import type { ShotType } from './types.ts';

export const SHOTS: ShotType[] = [
  { id: 'serve', label: 'Serve', depth: 'mid' },
  { id: 'groundstroke', label: 'Groundstroke', depth: 'mid' },
  { id: 'volley', label: 'Volley', depth: 'front' },
  { id: 'overhead', label: 'Overhead', depth: 'back' },
  { id: 'lob', label: 'Lob', depth: 'back' },
];

const BY_ID = new Map(SHOTS.map((s) => [s.id, s]));

function humanise(id: string): string {
  const text = id.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Sessions saved before the library was reduced can still reference retired shot ids. */
export function getShot(id: string): ShotType {
  return BY_ID.get(id) ?? { id, label: humanise(id), depth: 'mid' };
}

export function shotLabel(id: string): string {
  return getShot(id).label;
}

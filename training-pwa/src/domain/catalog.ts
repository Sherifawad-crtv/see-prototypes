import type { ShotCategory, ShotType } from './types.ts';

export const CATEGORIES: ShotCategory[] = [
  'Serve and return',
  'Groundstrokes',
  'Volleys',
  'Overheads',
  'Defensive and touch',
  'Wall shots',
];

export const SHOTS: ShotType[] = [
  { id: 'serve', label: 'Serve', category: 'Serve and return', depth: 'mid' },
  { id: 'return-of-serve', label: 'Return of serve', category: 'Serve and return', depth: 'back' },
  { id: 'forehand-drive', label: 'Forehand drive', category: 'Groundstrokes', depth: 'mid' },
  { id: 'backhand-drive', label: 'Backhand drive', category: 'Groundstrokes', depth: 'mid' },
  { id: 'forehand-volley', label: 'Forehand volley', category: 'Volleys', depth: 'front' },
  { id: 'backhand-volley', label: 'Backhand volley', category: 'Volleys', depth: 'front' },
  { id: 'drop-volley', label: 'Drop volley', category: 'Volleys', depth: 'front' },
  { id: 'bandeja', label: 'Bandeja', category: 'Overheads', depth: 'back' },
  { id: 'vibora', label: 'Víbora', category: 'Overheads', depth: 'back' },
  { id: 'flat-smash', label: 'Flat smash', category: 'Overheads', depth: 'mid' },
  { id: 'topspin-smash', label: 'Topspin smash', alias: 'Rulo', category: 'Overheads', depth: 'back' },
  { id: 'por-tres', label: 'Por tres', alias: 'x3 smash', category: 'Overheads', depth: 'back' },
  { id: 'por-cuatro', label: 'Por cuatro', alias: 'x4 smash', category: 'Overheads', depth: 'back' },
  { id: 'gancho', label: 'Gancho', category: 'Overheads', depth: 'back' },
  { id: 'cuchilla', label: 'Cuchilla', category: 'Overheads', depth: 'mid' },
  { id: 'lob', label: 'Lob', alias: 'Globo', category: 'Defensive and touch', depth: 'back' },
  { id: 'chiquita', label: 'Chiquita', category: 'Defensive and touch', depth: 'front' },
  { id: 'drop-shot', label: 'Drop shot', alias: 'Dejada', category: 'Defensive and touch', depth: 'front' },
  { id: 'back-wall-exit-forehand', label: 'Back wall exit forehand', category: 'Wall shots', depth: 'mid' },
  { id: 'back-wall-exit-backhand', label: 'Back wall exit backhand', category: 'Wall shots', depth: 'mid' },
  { id: 'side-wall-exit', label: 'Side wall exit', category: 'Wall shots', depth: 'mid' },
  { id: 'double-wall-exit', label: 'Double wall exit', alias: 'Doble pared', category: 'Wall shots', depth: 'back' },
  { id: 'contrapared', label: 'Contrapared', category: 'Wall shots', depth: 'mid' },
  { id: 'bajada', label: 'Bajada', category: 'Wall shots', depth: 'mid' },
];

const BY_ID = new Map(SHOTS.map((s) => [s.id, s]));

export function getShot(id: string): ShotType {
  const shot = BY_ID.get(id);
  if (!shot) throw new Error(`Unknown shot: ${id}`);
  return shot;
}

export function shotLabel(id: string): string {
  return getShot(id).label;
}

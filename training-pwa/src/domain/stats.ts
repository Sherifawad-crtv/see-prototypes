import type { CartItem, Mode, Session, SessionSummary, ShotEvent } from './types.ts';

export interface ModeTotals {
  total: number;
  free: number;
  targeted: number;
}

export interface OnTargetRow {
  shotId: string;
  hits: number;
  total: number;
  pct: number;
}

export interface OnTargetStats {
  hits: number;
  total: number;
  pct: number;
  byShot: OnTargetRow[];
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function itemsById(session: Session): Map<string, CartItem> {
  return new Map(session.cart.map((item) => [item.id, item]));
}

export function shotMode(session: Session, shot: ShotEvent): Mode {
  return itemsById(session).get(shot.cartItemId)?.mode ?? 'free';
}

export function shotsInMode(session: Session, mode: Mode): ShotEvent[] {
  const items = itemsById(session);
  return session.shots.filter((shot) => (items.get(shot.cartItemId)?.mode ?? 'free') === mode);
}

export function totals(session: Session): ModeTotals {
  const targeted = shotsInMode(session, 'targeted').length;
  return { total: session.shots.length, free: session.shots.length - targeted, targeted };
}

export function onTarget(session: Session): OnTargetStats {
  const shots = shotsInMode(session, 'targeted');
  const rows = new Map<string, { hits: number; total: number }>();
  for (const shot of shots) {
    const row = rows.get(shot.shotId) ?? { hits: 0, total: 0 };
    row.total += 1;
    if (shot.hit) row.hits += 1;
    rows.set(shot.shotId, row);
  }
  const byShot = [...rows.entries()].map(([shotId, row]) => ({
    shotId,
    hits: row.hits,
    total: row.total,
    pct: pct(row.hits, row.total),
  }));
  const hits = byShot.reduce((sum, row) => sum + row.hits, 0);
  return { hits, total: shots.length, pct: pct(hits, shots.length), byShot };
}

export function summarise(session: Session): SessionSummary {
  const start = Date.parse(session.startedAt);
  const lastShot = session.shots.at(-1);
  const end = session.endedAt
    ? Date.parse(session.endedAt)
    : lastShot
      ? Date.parse(lastShot.at)
      : start;
  const targeted = onTarget(session);
  return {
    id: session.id,
    startedAt: session.startedAt,
    durationSec: Math.max(0, Math.round((end - start) / 1000)),
    totalShots: session.shots.length,
    shotIds: [...new Set(session.shots.map((shot) => shot.shotId))],
    ...(targeted.total > 0 ? { onTargetPct: targeted.pct } : {}),
  };
}

export const METRES_PER_SHOT = 4;
export const METRES_PER_SECOND = 0.5;
export const KCAL_PER_MINUTE = 7;

export interface Activity {
  distanceKm: number;
  calories: number;
}

/** Mock estimate. The real tracker will report measured distance and energy. */
export function activity(session: Session): Activity {
  const { durationSec, totalShots } = summarise(session);
  const metres = totalShots * METRES_PER_SHOT + durationSec * METRES_PER_SECOND;
  return {
    distanceKm: Math.round(metres / 10) / 100,
    calories: Math.round((durationSec / 60) * KCAL_PER_MINUTE),
  };
}

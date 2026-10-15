import { shotLabel } from './catalog.ts';
import type { CartItem, Mode, Session, SessionSummary, ShotEvent, ZoneId } from './types.ts';
import { getZone } from './zones.ts';

export interface ModeTotals {
  total: number;
  free: number;
  targeted: number;
}

export interface DistributionRow {
  shotId: string;
  count: number;
  pct: number;
}

export interface OnTargetRow {
  shotId: string;
  zones: ZoneId[];
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

export const MIN_MISSES_FOR_INSIGHT = 5;
export const INSIGHT_OFFSET_THRESHOLD = 0.15;

export const NO_PATTERN_TEXT = 'No clear miss pattern yet';
export const NO_MISSES_TEXT = 'No misses, nice.';

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

export function distribution(session: Session, mode: Mode): DistributionRow[] {
  const shots = shotsInMode(session, mode);
  const counts = new Map<string, number>();
  for (const shot of shots) counts.set(shot.shotId, (counts.get(shot.shotId) ?? 0) + 1);
  return [...counts.entries()]
    .map(([shotId, count]) => ({ shotId, count, pct: pct(count, shots.length) }))
    .sort((a, b) => b.count - a.count);
}

export function onTarget(session: Session): OnTargetStats {
  const shots = shotsInMode(session, 'targeted');
  const items = itemsById(session);
  const rows = new Map<string, { zones: Set<ZoneId>; hits: number; total: number }>();
  for (const shot of shots) {
    const row = rows.get(shot.shotId) ?? { zones: new Set<ZoneId>(), hits: 0, total: 0 };
    const zone = items.get(shot.cartItemId)?.targetZone;
    if (zone) row.zones.add(zone);
    row.total += 1;
    if (shot.hit) row.hits += 1;
    rows.set(shot.shotId, row);
  }
  const byShot = [...rows.entries()].map(([shotId, row]) => ({
    shotId,
    zones: [...row.zones],
    hits: row.hits,
    total: row.total,
    pct: pct(row.hits, row.total),
  }));
  const hits = byShot.reduce((sum, row) => sum + row.hits, 0);
  return { hits, total: shots.length, pct: pct(hits, shots.length), byShot };
}

export function insight(session: Session): string | null {
  const shots = shotsInMode(session, 'targeted');
  if (shots.length === 0) return null;
  const misses = shots.filter((shot) => !shot.hit);
  if (misses.length === 0) return NO_MISSES_TEXT;

  const items = itemsById(session);
  const missesByShot = new Map<string, ShotEvent[]>();
  for (const miss of misses) {
    missesByShot.set(miss.shotId, [...(missesByShot.get(miss.shotId) ?? []), miss]);
  }

  let worstShotId: string | null = null;
  let worstMisses: ShotEvent[] = [];
  for (const [shotId, list] of missesByShot) {
    if (list.length >= MIN_MISSES_FOR_INSIGHT && list.length > worstMisses.length) {
      worstShotId = shotId;
      worstMisses = list;
    }
  }
  if (worstShotId === null) return NO_PATTERN_TEXT;

  let dx = 0;
  let dy = 0;
  let counted = 0;
  for (const miss of worstMisses) {
    const zoneId = items.get(miss.cartItemId)?.targetZone;
    if (!zoneId) continue;
    const zone = getZone(zoneId);
    dx += miss.landing.x - zone.cx;
    dy += miss.landing.y - zone.cy;
    counted += 1;
  }
  if (counted === 0) return NO_PATTERN_TEXT;
  dx /= counted;
  dy /= counted;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < INSIGHT_OFFSET_THRESHOLD) return NO_PATTERN_TEXT;
  const direction =
    Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 'short' : 'long') : dx < 0 ? 'left' : 'right';
  return `${shotLabel(worstShotId)}: most misses land ${direction} of the target`;
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

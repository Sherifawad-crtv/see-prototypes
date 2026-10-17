import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { onTarget, summarise, totals } from './stats.ts';
import type { CartItem, Session, ShotEvent, ZoneId } from './types.ts';

const T0 = '2026-01-01T10:00:00.000Z';

function item(id: string, shotId: string, mode: 'free' | 'targeted', zone?: ZoneId): CartItem {
  return {
    id,
    shotId,
    mode,
    amount: { kind: 'count', n: 10 },
    status: 'done',
    detected: 0,
    ...(zone ? { targetZone: zone } : {}),
  };
}

let counter = 0;
function shot(
  cartItemId: string,
  shotId: string,
  x: number,
  y: number,
  hit?: boolean,
): ShotEvent {
  counter += 1;
  return {
    id: `s${counter}`,
    cartItemId,
    shotId,
    at: '2026-01-01T10:01:00.000Z',
    landing: { x, y },
    inBounds: x >= 0 && x <= 1 && y >= 0 && y <= 1,
    ...(hit === undefined ? {} : { hit }),
  };
}

function session(cart: CartItem[], shots: ShotEvent[], endedAt?: string): Session {
  return {
    id: 'sess',
    startedAt: T0,
    phase: 'ended',
    cart,
    shots,
    ...(endedAt ? { endedAt } : {}),
  };
}

const empty = session([], [], T0);

describe('totals', () => {
  it('handles an empty session', () => {
    assert.deepEqual(totals(empty), { total: 0, free: 0, targeted: 0 });
  });

  it('splits shots by mode', () => {
    const s = session(
      [item('a', 'lob', 'free'), item('b', 'overhead', 'targeted', 'back-right')],
      [shot('a', 'lob', 0.5, 0.5), shot('a', 'lob', 0.4, 0.5), shot('b', 'overhead', 0.8, 0.8, true)],
    );
    assert.deepEqual(totals(s), { total: 3, free: 2, targeted: 1 });
  });
});

describe('onTarget', () => {
  it('returns zeros for an empty session', () => {
    assert.deepEqual(onTarget(empty), { hits: 0, total: 0, pct: 0, byShot: [] });
  });

  it('counts only out-of-bounds shots as misses', () => {
    const s = session(
      [item('a', 'overhead', 'targeted', 'back-right')],
      [shot('a', 'overhead', 1.2, 0.8, false), shot('a', 'overhead', 0.9, 1.3, false)],
    );
    const result = onTarget(s);
    assert.equal(result.hits, 0);
    assert.equal(result.total, 2);
    assert.equal(result.pct, 0);
    assert.deepEqual(result.byShot, [
      { shotId: 'overhead', zones: ['back-right'], hits: 0, total: 2, pct: 0 },
    ]);
  });

  it('computes hits per shot type and overall', () => {
    const s = session(
      [
        item('a', 'overhead', 'targeted', 'back-right'),
        item('b', 'lob', 'targeted', 'back-left'),
        item('c', 'serve', 'free'),
      ],
      [
        shot('a', 'overhead', 0.8, 0.8, true),
        shot('a', 'overhead', 0.2, 0.8, false),
        shot('b', 'lob', 0.2, 0.9, true),
        shot('b', 'lob', 0.3, 0.8, true),
        shot('c', 'serve', 0.5, 0.5),
      ],
    );
    const result = onTarget(s);
    assert.equal(result.hits, 3);
    assert.equal(result.total, 4);
    assert.equal(result.pct, 75);
    assert.deepEqual(
      result.byShot.map((row) => [row.shotId, row.hits, row.total, row.pct]),
      [
        ['overhead', 1, 2, 50],
        ['lob', 2, 2, 100],
      ],
    );
  });
});

describe('summarise', () => {
  it('summarises an empty session', () => {
    assert.deepEqual(summarise(empty), {
      id: 'sess',
      startedAt: T0,
      durationSec: 0,
      totalShots: 0,
      shotIds: [],
    });
  });

  it('includes duration, distinct shots and on-target percentage', () => {
    const s = session(
      [item('a', 'lob', 'free'), item('b', 'overhead', 'targeted', 'back-right')],
      [
        shot('a', 'lob', 0.5, 0.5),
        shot('a', 'lob', 0.5, 0.5),
        shot('b', 'overhead', 0.8, 0.8, true),
        shot('b', 'overhead', 0.2, 0.8, false),
      ],
      '2026-01-01T10:12:30.000Z',
    );
    assert.deepEqual(summarise(s), {
      id: 'sess',
      startedAt: T0,
      durationSec: 750,
      totalShots: 4,
      shotIds: ['lob', 'overhead'],
      onTargetPct: 50,
    });
  });

  it('has no on-target percentage for Free-only sessions', () => {
    const s = session([item('a', 'lob', 'free')], [shot('a', 'lob', 0.5, 0.5)]);
    assert.equal(summarise(s).onTargetPct, undefined);
  });
});

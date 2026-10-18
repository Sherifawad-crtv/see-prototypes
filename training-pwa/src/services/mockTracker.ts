import type { CartItem, ShotEvent } from '../domain/types.ts';
import { getShot } from '../domain/catalog.ts';
import { areaCentre, inArea, inBounds } from '../domain/court.ts';
import { BASKET_SIZE } from './contracts.ts';
import type { TrackerService } from './contracts.ts';

export interface TrackerConfig {
  intervalMs: number;
  targetedSigma: number;
}

export const trackerConfig: TrackerConfig = {
  intervalMs: 1800,
  targetedSigma: 0.17,
};

const FREE_SIGMA_X = 0.22;
const FREE_SIGMA_Y = 0.15;
const DEPTH_CENTRE = { front: 0.2, mid: 0.5, back: 0.8 } as const;

function normal(mean: number, sigma: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function drillSize(item: CartItem): number {
  return item.amount.kind === 'count' ? item.amount.n : BASKET_SIZE;
}

function sampleLanding(item: CartItem): { x: number; y: number } {
  if (item.mode === 'targeted' && item.targetArea) {
    const centre = areaCentre(item.targetArea);
    return {
      x: normal(centre.x, trackerConfig.targetedSigma),
      y: normal(centre.y, trackerConfig.targetedSigma),
    };
  }
  return {
    x: normal(0.5, FREE_SIGMA_X),
    y: normal(DEPTH_CENTRE[getShot(item.shotId).depth], FREE_SIGMA_Y),
  };
}

export class MockTracker implements TrackerService {
  private item: CartItem | null = null;
  private remaining = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private shotListeners = new Set<(e: ShotEvent) => void>();
  private completeListeners = new Set<(cartItemId: string) => void>();

  start(item: CartItem): void {
    this.stop();
    this.item = item;
    this.remaining = Math.max(0, drillSize(item) - item.detected);
    this.paused = false;
    this.schedule();
  }

  pause(): void {
    this.paused = true;
    this.clearTimer();
  }

  resume(): void {
    if (!this.item || !this.paused) return;
    this.paused = false;
    this.schedule();
  }

  stop(): void {
    this.clearTimer();
    this.item = null;
    this.remaining = 0;
    this.paused = false;
  }

  onShot(cb: (e: ShotEvent) => void): () => void {
    this.shotListeners.add(cb);
    return () => this.shotListeners.delete(cb);
  }

  onDrillComplete(cb: (cartItemId: string) => void): () => void {
    this.completeListeners.add(cb);
    return () => this.completeListeners.delete(cb);
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    this.clearTimer();
    const delay = this.remaining === 0 ? 0 : trackerConfig.intervalMs;
    this.timer = setTimeout(() => this.tick(), delay);
  }

  private tick(): void {
    this.timer = null;
    const item = this.item;
    if (!item) return;
    if (this.remaining > 0) {
      this.remaining -= 1;
      const landing = sampleLanding(item);
      const landed = inBounds(landing.x, landing.y);
      const event: ShotEvent = {
        id: crypto.randomUUID(),
        cartItemId: item.id,
        shotId: item.shotId,
        at: new Date().toISOString(),
        landing,
        inBounds: landed,
        ...(item.mode === 'targeted'
          ? { hit: landed && item.targetArea !== undefined && inArea(item.targetArea, landing.x, landing.y) }
          : {}),
      };
      this.shotListeners.forEach((cb) => cb(event));
    }
    if (this.remaining === 0) {
      this.item = null;
      this.completeListeners.forEach((cb) => cb(item.id));
      return;
    }
    this.schedule();
  }
}

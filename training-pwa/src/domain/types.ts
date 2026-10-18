export type Depth = 'front' | 'mid' | 'back';

export interface ShotType {
  id: string;
  label: string;
  depth: Depth;
}

export type Mode = 'free' | 'targeted';

/** A rectangle on the opponent half. x runs left to right, y runs from the net (0) to the back wall (1). */
export interface Area {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type Amount = { kind: 'count'; n: number } | { kind: 'basket' };

export interface CartItem {
  id: string;
  shotId: string;
  mode: Mode;
  amount: Amount;
  targetArea?: Area;
  status: 'upcoming' | 'running' | 'done';
  detected: number;
}

export interface ShotEvent {
  id: string;
  cartItemId: string;
  shotId: string;
  at: string;
  landing: { x: number; y: number };
  inBounds: boolean;
  hit?: boolean;
}

export type Phase = 'building' | 'running' | 'paused' | 'idle' | 'ended';

export interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  phase: Phase;
  cart: CartItem[];
  shots: ShotEvent[];
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  durationSec: number;
  totalShots: number;
  shotIds: string[];
  onTargetPct?: number;
}

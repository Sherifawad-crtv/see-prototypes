export type Depth = 'front' | 'mid' | 'back';

export interface ShotType {
  id: string;
  label: string;
  depth: Depth;
}

export type Mode = 'free' | 'targeted';

/** A cone on the opponent half. x runs left to right, y runs from the net (0) to the back wall (1). */
export interface Cone {
  x: number;
  y: number;
}

/** A set of cones. Once it has enough cones, a circle is drawn around it and that circle is the target. */
export type Zone = Cone[];

export type Amount = { kind: 'count'; n: number } | { kind: 'basket' };

export interface CartItem {
  id: string;
  shotId: string;
  mode: Mode;
  amount: Amount;
  zones?: Zone[];
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

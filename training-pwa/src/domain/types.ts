export type Depth = 'front' | 'mid' | 'back';

export interface ShotType {
  id: string;
  label: string;
  depth: Depth;
}

export type Mode = 'free' | 'targeted';

export type ZoneId =
  | 'front-left'
  | 'front-right'
  | 'mid-left'
  | 'mid-right'
  | 'back-left'
  | 'back-right';

export type Amount = { kind: 'count'; n: number } | { kind: 'basket' };

export interface CartItem {
  id: string;
  shotId: string;
  mode: Mode;
  amount: Amount;
  targetZone?: ZoneId;
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

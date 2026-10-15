import type { CartItem, Session, SessionSummary, ShotEvent } from '../domain/types.ts';

export interface TrackerService {
  start(item: CartItem): void;
  pause(): void;
  resume(): void;
  stop(): void;
  onShot(cb: (e: ShotEvent) => void): () => void;
  onDrillComplete(cb: (cartItemId: string) => void): () => void;
}

export interface SessionRepository {
  list(): Promise<SessionSummary[]>;
  get(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  saveInProgress(session: Session): Promise<void>;
  getInProgress(): Promise<Session | null>;
  clearInProgress(): Promise<void>;
}

export const BASKET_SIZE = 40;

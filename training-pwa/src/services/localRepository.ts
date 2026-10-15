import { summarise } from '../domain/stats.ts';
import type { Session, SessionSummary } from '../domain/types.ts';
import type { SessionRepository } from './contracts.ts';

const SESSIONS_KEY = 'see-training:v1:sessions';
const IN_PROGRESS_KEY = 'see-training:v1:in-progress';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the session stays in memory.
  }
}

export class LocalRepository implements SessionRepository {
  async list(): Promise<SessionSummary[]> {
    return read<Session[]>(SESSIONS_KEY, [])
      .map(summarise)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async get(id: string): Promise<Session | null> {
    return read<Session[]>(SESSIONS_KEY, []).find((s) => s.id === id) ?? null;
  }

  async save(session: Session): Promise<void> {
    const others = read<Session[]>(SESSIONS_KEY, []).filter((s) => s.id !== session.id);
    write(SESSIONS_KEY, [...others, session]);
  }

  async saveInProgress(session: Session): Promise<void> {
    write(IN_PROGRESS_KEY, session);
  }

  async getInProgress(): Promise<Session | null> {
    return read<Session | null>(IN_PROGRESS_KEY, null);
  }

  async clearInProgress(): Promise<void> {
    try {
      localStorage.removeItem(IN_PROGRESS_KEY);
    } catch {
      // Nothing to clear when storage is blocked.
    }
  }

  async clearAll(): Promise<void> {
    await this.clearInProgress();
    try {
      localStorage.removeItem(SESSIONS_KEY);
    } catch {
      // Nothing to clear when storage is blocked.
    }
  }
}

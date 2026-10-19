import type {
  Amount,
  Zone,
  CartItem,
  Mode,
  Session,
  SessionSummary,
  ShotEvent,
} from '../domain/types.ts';
import { zonesReady } from '../domain/court.ts';

export const MAX_DRILLS = 20;
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 50;
export const DEFAULT_COUNT = 10;
export const DRAFT_KEY = 'draft';

export type Screen = 'training' | 'cart' | 'add' | 'target' | 'results';
export type Sheet = null | 'amount' | 'endConfirm' | 'discard' | 'resume' | 'saved';

export interface Draft {
  mode: Mode;
  shotId: string | null;
  zones: Zone[];
  amount: Amount;
}

export interface Toast {
  id: number;
  text: string;
}

export interface State {
  ready: boolean;
  history: SessionSummary[];
  session: Session | null;
  viewing: Session | null;
  resumeCandidate: Session | null;
  stack: Screen[];
  sheet: Sheet;
  draft: Draft;
  lastCounts: Record<string, number>;
  toast: Toast | null;
  /** Index of the tutorial step on screen, or null when the tutorial is closed. */
  tour: number | null;
}

export type Action =
  | { type: 'loaded'; history: SessionSummary[]; inProgress: Session | null }
  | { type: 'history'; history: SessionSummary[] }
  | { type: 'nav/push'; screen: Screen }
  | { type: 'nav/replace'; screen: Screen }
  | { type: 'nav/sync'; depth: number }
  | { type: 'sheet'; sheet: Sheet }
  | { type: 'toast'; text: string }
  | { type: 'toast/clear'; id: number }
  | { type: 'session/new'; id: string; at: string }
  | { type: 'session/discard' }
  | { type: 'tour'; step: number | null }
  | { type: 'draft/mode'; mode: Mode }
  | { type: 'draft/pick'; shotId: string; reuseZones: Zone[] }
  | { type: 'draft/zones'; zones: Zone[] }
  | { type: 'draft/amount'; amount: Amount }
  | { type: 'cart/add'; id: string }
  | { type: 'cart/move'; id: string; dir: -1 | 1 }
  | { type: 'cart/delete'; id: string }
  | { type: 'cart/redo'; id: string; newId: string }
  | { type: 'cart/amount'; id: string; amount: Amount }
  | { type: 'session/start'; at: string }
  | { type: 'shot'; event: ShotEvent }
  | { type: 'drill/complete'; id: string }
  | { type: 'session/ended'; session: Session }
  | { type: 'session/restore'; session: Session }
  | { type: 'viewing'; session: Session };

export const initialState: State = {
  ready: false,
  history: [],
  session: null,
  viewing: null,
  resumeCandidate: null,
  stack: ['training'],
  sheet: null,
  draft: {
    mode: 'free',
    shotId: null,
    zones: [],
    amount: { kind: 'count', n: DEFAULT_COUNT },
  },
  lastCounts: {},
  toast: null,
  tour: null,
};

export function runningItem(session: Session | null): CartItem | undefined {
  return session?.cart.find((item) => item.status === 'running');
}

export function upcomingItems(session: Session | null): CartItem[] {
  return session?.cart.filter((item) => item.status === 'upcoming') ?? [];
}

export function canMove(cart: CartItem[], index: number, dir: -1 | 1): boolean {
  const item = cart[index];
  const neighbour = cart[index + dir];
  return item?.status === 'upcoming' && neighbour?.status === 'upcoming';
}

export function finalizeSession(session: Session, at: string): Session {
  return {
    ...session,
    phase: 'ended',
    endedAt: at,
    cart: session.cart.map((item) =>
      item.status === 'running' ? { ...item, status: 'done' } : item,
    ),
  };
}

function withAmount(
  lastCounts: Record<string, number>,
  key: string,
  current: Amount,
  next: Amount,
): Record<string, number> {
  return current.kind === 'count' && next.kind === 'basket'
    ? { ...lastCounts, [key]: current.n }
    : lastCounts;
}

function promoteNext(cart: CartItem[]): CartItem[] {
  const index = cart.findIndex((item) => item.status === 'upcoming');
  return index < 0
    ? cart
    : cart.map((item, i) => (i === index ? { ...item, status: 'running' } : item));
}

function copyOf(source: CartItem, id: string): CartItem {
  return {
    id,
    shotId: source.shotId,
    mode: source.mode,
    amount: source.amount,
    status: 'upcoming',
    detected: 0,
    ...(source.zones ? { zones: source.zones } : {}),
  };
}

function updateSession(state: State, change: (session: Session) => Session): State {
  return state.session ? { ...state, session: change(state.session) } : state;
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        ready: true,
        history: action.history,
        resumeCandidate: action.inProgress,
        sheet: action.inProgress ? 'resume' : null,
      };
    case 'history':
      return { ...state, history: action.history };
    case 'nav/push':
      return { ...state, toast: null, stack: [...state.stack, action.screen] };
    case 'nav/replace':
      return { ...state, toast: null, stack: [...state.stack.slice(0, -1), action.screen] };
    case 'nav/sync':
      return action.depth + 1 >= state.stack.length
        ? state
        : { ...state, stack: state.stack.slice(0, action.depth + 1), sheet: null };
    case 'sheet':
      return { ...state, sheet: action.sheet };
    case 'toast':
      return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, text: action.text } };
    case 'toast/clear':
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
    case 'session/new':
      return {
        ...state,
        session: {
          id: action.id,
          startedAt: action.at,
          phase: 'building',
          cart: [],
          shots: [],
        },
      };
    case 'tour':
      return { ...state, tour: action.step };
    case 'session/discard':
      return { ...state, session: null, sheet: null };
    case 'draft/mode':
      return { ...state, draft: { ...state.draft, mode: action.mode } };
    case 'draft/pick':
      return {
        ...state,
        lastCounts: { ...state.lastCounts, [DRAFT_KEY]: DEFAULT_COUNT },
        draft: {
          ...state.draft,
          shotId: action.shotId,
          zones: state.draft.mode === 'targeted' ? action.reuseZones : [],
          amount: { kind: 'count', n: DEFAULT_COUNT },
        },
      };
    case 'draft/zones':
      return { ...state, draft: { ...state.draft, zones: action.zones } };
    case 'draft/amount':
      return {
        ...state,
        lastCounts: withAmount(state.lastCounts, DRAFT_KEY, state.draft.amount, action.amount),
        draft: { ...state.draft, amount: action.amount },
      };
    case 'cart/add': {
      const { draft, session } = state;
      if (!session || !draft.shotId || session.cart.length >= MAX_DRILLS) return state;
      if (draft.mode === 'targeted' && !zonesReady(draft.zones)) return state;
      const zones = draft.mode === 'targeted' ? draft.zones.filter((zone) => zone.length > 0) : null;
      const item: CartItem = {
        id: action.id,
        shotId: draft.shotId,
        mode: draft.mode,
        amount: draft.amount,
        status: 'upcoming',
        detected: 0,
        ...(zones ? { zones } : {}),
      };
      const retargeted = session.cart.map((existing) =>
        zones &&
        existing.status === 'upcoming' &&
        existing.mode === 'targeted' &&
        existing.shotId === draft.shotId
          ? { ...existing, zones }
          : existing,
      );
      return {
        ...state,
        sheet: null,
        session: { ...session, cart: [...retargeted, item] },
        draft: { ...draft, shotId: null, zones: [] },
      };
    }
    case 'cart/move':
      return updateSession(state, (session) => {
        const index = session.cart.findIndex((item) => item.id === action.id);
        if (index < 0 || !canMove(session.cart, index, action.dir)) return session;
        const cart = [...session.cart];
        const swap = index + action.dir;
        [cart[index], cart[swap]] = [cart[swap]!, cart[index]!];
        return { ...session, cart };
      });
    case 'cart/delete':
      return updateSession(state, (session) => ({
        ...session,
        cart: session.cart.filter((item) => !(item.id === action.id && item.status === 'upcoming')),
      }));
    case 'cart/redo':
      return updateSession(state, (session) => {
        const index = session.cart.findIndex((item) => item.id === action.id);
        const source = session.cart[index];
        if (!source || session.cart.length >= MAX_DRILLS) return session;
        const cart = [...session.cart];
        cart.splice(index + 1, 0, copyOf(source, action.newId));
        return { ...session, cart };
      });
    case 'cart/amount': {
      const current = state.session?.cart.find((item) => item.id === action.id);
      if (!current || current.status !== 'upcoming') return state;
      const next = updateSession(state, (session) => ({
        ...session,
        cart: session.cart.map((item) =>
          item.id === action.id ? { ...item, amount: action.amount } : item,
        ),
      }));
      return {
        ...next,
        lastCounts: withAmount(state.lastCounts, action.id, current.amount, action.amount),
      };
    }
    case 'session/start':
      return updateSession(state, (session) => {
        if (!session.cart.some((item) => item.status === 'upcoming')) return session;
        return {
          ...session,
          startedAt: session.phase === 'building' ? action.at : session.startedAt,
          phase: 'running',
          cart: promoteNext(session.cart),
        };
      });
    case 'shot':
      return updateSession(state, (session) => ({
        ...session,
        shots: [...session.shots, action.event],
        cart: session.cart.map((item) =>
          item.id === action.event.cartItemId ? { ...item, detected: item.detected + 1 } : item,
        ),
      }));
    case 'drill/complete':
      return updateSession(state, (session) => {
        const target = session.cart.find((item) => item.id === action.id);
        if (!target || target.status !== 'running') return session;
        const cart = promoteNext(
          session.cart.map((item) => (item.id === action.id ? { ...item, status: 'done' } : item)),
        );
        return {
          ...session,
          cart,
          phase: cart.some((item) => item.status === 'running') ? 'running' : 'idle',
        };
      });
    case 'session/ended':
      return { ...state, session: null, viewing: action.session, sheet: null };
    case 'session/restore':
      return {
        ...state,
        session: action.session,
        resumeCandidate: null,
        sheet: null,
        stack: state.stack.slice(0, 1),
      };
    case 'viewing':
      return { ...state, viewing: action.session };
  }
}

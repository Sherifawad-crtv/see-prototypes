import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { shotLabel } from '../domain/catalog.ts';
import type { Amount, CartItem, Mode, Session, ZoneId } from '../domain/types.ts';
import { repository, tracker } from '../services/index.ts';
import {
  finalizeSession,
  initialState,
  MAX_DRILLS,
  reducer,
  runningItem,
  type Screen,
  type State,
} from './reducer.ts';

const TOAST_MS = 2200;

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function amountText(amount: Amount): string {
  return amount.kind === 'count' ? `× ${amount.n}` : '· Full basket';
}

export function reusableZone(session: Session | null, shotId: string): ZoneId | null {
  const match = session?.cart.findLast((item) => item.mode === 'targeted' && item.shotId === shotId);
  return match?.targetZone ?? null;
}

function createActions(
  getState: () => State,
  dispatch: (action: Parameters<typeof reducer>[1]) => void,
  nav: {
    push: (screen: Screen) => void;
    replace: (screen: Screen) => void;
    popTo: (screen: Screen) => void;
    back: () => void;
    leave: () => void;
  },
) {
  const refreshHistory = async () => {
    dispatch({ type: 'history', history: await repository.list() });
  };

  const persistEnded = async (ended: Session) => {
    await repository.save(ended);
    await repository.clearInProgress();
    await refreshHistory();
  };

  const endSession = () => {
    const { session } = getState();
    if (!session) return;
    const ended = finalizeSession(session, now());
    tracker.stop();
    dispatch({ type: 'session/ended', session: ended });
    nav.replace('results');
    void persistEnded(ended);
  };

  return {
    startTraining() {
      dispatch({ type: 'session/new', id: uid(), at: now() });
      nav.push('cart');
    },
    openAdd() {
      nav.push('add');
    },
    back: nav.back,
    closeSheet() {
      dispatch({ type: 'sheet', sheet: null });
    },
    cartBack() {
      const { session } = getState();
      if (session?.phase !== 'building') return nav.back();
      if (session.cart.length > 0) return dispatch({ type: 'sheet', sheet: 'discard' });
      dispatch({ type: 'session/discard' });
      nav.leave();
    },
    discardCart() {
      dispatch({ type: 'session/discard' });
      nav.leave();
    },
    setMode(mode: Mode) {
      dispatch({ type: 'draft/mode', mode });
    },
    pickShot(shotId: string) {
      const { session, draft } = getState();
      const reuseZone = draft.mode === 'targeted' ? reusableZone(session, shotId) : null;
      dispatch({ type: 'draft/pick', shotId, reuseZone });
      if (draft.mode === 'targeted' && !reuseZone) nav.push('target');
      else dispatch({ type: 'sheet', sheet: 'amount' });
    },
    setZone(zone: ZoneId) {
      dispatch({ type: 'draft/zone', zone });
    },
    confirmTarget() {
      dispatch({ type: 'sheet', sheet: 'amount' });
    },
    changeTarget() {
      dispatch({ type: 'sheet', sheet: null });
      if (getState().stack.at(-1) !== 'target') nav.push('target');
    },
    setDraftAmount(amount: Amount) {
      dispatch({ type: 'draft/amount', amount });
    },
    addToCart() {
      const { session } = getState();
      if (!session || session.cart.length >= MAX_DRILLS) return;
      dispatch({ type: 'cart/add', id: uid() });
      nav.popTo('cart');
    },
    moveItem(id: string, dir: -1 | 1) {
      dispatch({ type: 'cart/move', id, dir });
    },
    deleteItem(id: string) {
      dispatch({ type: 'cart/delete', id });
    },
    redoItem(id: string) {
      const { session } = getState();
      if (session && session.cart.length >= MAX_DRILLS) {
        dispatch({ type: 'toast', text: 'Cart is full' });
        return;
      }
      dispatch({ type: 'cart/redo', id, newId: uid() });
    },
    setItemAmount(id: string, amount: Amount) {
      dispatch({ type: 'cart/amount', id, amount });
    },
    start() {
      const { session } = getState();
      if (!session) return;
      dispatch({ type: 'session/start', at: now() });
      if (session.phase === 'building') nav.replace('live');
      else nav.popTo('live');
    },
    trainAnother() {
      dispatch({ type: 'session/pause' });
      nav.push('cart');
    },
    redoLive() {
      const { session } = getState();
      if (!session) return;
      if (session.cart.length >= MAX_DRILLS) {
        dispatch({ type: 'toast', text: 'Cart is full' });
        return;
      }
      const source: CartItem | undefined = runningItem(session) ?? session.cart.at(-1);
      if (!source) return;
      dispatch({ type: 'live/redo', newId: uid() });
      dispatch({
        type: 'toast',
        text: `Added ${shotLabel(source.shotId)} ${amountText(source.amount)} to your cart`,
      });
    },
    requestEnd() {
      const { session } = getState();
      if (!session) return;
      const active = session.cart.some((item) => item.status !== 'done');
      if (active) dispatch({ type: 'sheet', sheet: 'endConfirm' });
      else endSession();
    },
    endSession,
    resumeSession() {
      const { resumeCandidate } = getState();
      if (!resumeCandidate) return;
      dispatch({
        type: 'session/restore',
        session:
          resumeCandidate.phase === 'paused'
            ? { ...resumeCandidate, phase: 'running' }
            : resumeCandidate,
      });
      nav.push('live');
    },
    endResumed() {
      const { resumeCandidate } = getState();
      if (!resumeCandidate) return;
      const ended = finalizeSession(resumeCandidate, now());
      dispatch({ type: 'viewing', session: ended });
      dispatch({ type: 'sheet', sheet: null });
      nav.push('results');
      void persistEnded(ended);
    },
    async openHistory(id: string) {
      const session = await repository.get(id);
      if (!session) return;
      dispatch({ type: 'viewing', session });
      nav.push('results');
    },
    refreshHistory,
  };
}

export type Actions = ReturnType<typeof createActions>;

interface TrainingContextValue {
  state: State;
  actions: Actions;
}

const TrainingContext = createContext<TrainingContextValue | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const depth = useRef(0);
  const bypassGuard = useRef(false);
  const trackedItem = useRef<string | null>(null);

  const actions = useMemo(() => {
    const nav = {
      push(screen: Screen) {
        depth.current += 1;
        history.pushState({ i: depth.current }, '');
        dispatch({ type: 'nav/push', screen });
      },
      replace(screen: Screen) {
        history.replaceState({ i: depth.current }, '');
        dispatch({ type: 'nav/replace', screen });
      },
      popTo(screen: Screen) {
        const { stack } = stateRef.current;
        const steps = stack.length - 1 - stack.lastIndexOf(screen);
        if (steps > 0) history.go(-steps);
      },
      back() {
        history.back();
      },
      leave() {
        bypassGuard.current = true;
        history.back();
      },
    };
    return createActions(() => stateRef.current, dispatch, nav);
  }, []);

  useEffect(() => {
    history.replaceState({ i: 0 }, '');
    void Promise.all([repository.list(), repository.getInProgress()]).then(
      ([historyList, inProgress]) => {
        dispatch({ type: 'loaded', history: historyList, inProgress });
      },
    );
  }, []);

  useEffect(() => {
    const offShot = tracker.onShot((event) => dispatch({ type: 'shot', event }));
    const offDone = tracker.onDrillComplete((id) => dispatch({ type: 'drill/complete', id }));
    return () => {
      offShot();
      offDone();
    };
  }, []);

  const running = runningItem(state.session);
  const phase = state.session?.phase;
  useEffect(() => {
    if (!running || !phase) {
      if (trackedItem.current) tracker.stop();
      trackedItem.current = null;
      return;
    }
    if (phase === 'paused') {
      tracker.pause();
    } else if (phase === 'running') {
      if (trackedItem.current !== running.id) {
        tracker.start(running);
        trackedItem.current = running.id;
      } else {
        tracker.resume();
      }
    }
  }, [running?.id, phase]);

  useEffect(() => {
    const { session } = state;
    if (session && (session.phase === 'running' || session.phase === 'paused' || session.phase === 'idle')) {
      void repository.saveInProgress(session);
    }
  }, [state.session]);

  const top = state.stack.at(-1);
  useEffect(() => {
    if (top === 'live' && phase === 'paused') dispatch({ type: 'session/resume' });
  }, [top, phase]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const index = (event.state as { i?: number } | null)?.i ?? 0;
      const current = stateRef.current;
      const screen = current.stack.at(-1);
      const bypass = bypassGuard.current;
      bypassGuard.current = false;
      if (!bypass && index < depth.current) {
        if (screen === 'live') {
          history.pushState({ i: depth.current }, '');
          dispatch({ type: 'sheet', sheet: 'endConfirm' });
          return;
        }
        if (screen === 'cart' && current.session?.phase === 'building' && current.session.cart.length > 0) {
          history.pushState({ i: depth.current }, '');
          dispatch({ type: 'sheet', sheet: 'discard' });
          return;
        }
      }
      depth.current = index;
      dispatch({ type: 'nav/sync', depth: index });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!state.toast) return;
    const id = state.toast.id;
    const timer = setTimeout(() => dispatch({ type: 'toast/clear', id }), TOAST_MS);
    return () => clearTimeout(timer);
  }, [state.toast]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTraining(): TrainingContextValue {
  const value = useContext(TrainingContext);
  if (!value) throw new Error('useTraining must be used inside TrainingProvider');
  return value;
}

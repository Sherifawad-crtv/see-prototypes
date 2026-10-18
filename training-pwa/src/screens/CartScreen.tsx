import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import type { CartItem } from '../domain/types.ts';
import { areaLabel } from '../domain/court.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { canMove, DEFAULT_COUNT, MAX_DRILLS } from '../store/reducer.ts';
import { AmountControl } from '../ui/AmountControl.tsx';
import { Badge, Button, IconButton, ProgressBar } from '../ui/controls.tsx';
import { modeBadgeText, plural } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { AreaThumb } from '../ui/AreaThumb.tsx';

function RunProgress({ item }: { item: CartItem }) {
  const total = item.amount.kind === 'count' ? item.amount.n : null;
  return (
    <div className="run-progress">
      <p className="run-count t-stat-sm" aria-live="polite">
        {item.detected}
        <span className="t-label-sm text-2">{total !== null ? ` / ${total}` : ' shots'}</span>
      </p>
      {total !== null && <ProgressBar label="Drill progress" value={(item.detected / total) * 100} />}
    </div>
  );
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        const next = await navigator.wakeLock?.request('screen');
        if (!next) return;
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Wake lock is optional: it can be denied or unsupported.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [active]);
}

function DrillCard({ item, index, cart }: { item: CartItem; index: number; cart: CartItem[] }) {
  const { state, actions } = useTraining();
  const locked = item.status !== 'upcoming';
  const name = shotLabel(item.shotId);

  return (
    <li className={`drill drill-${item.status}`}>
      <div className="drill-card">
        <div className="drill-head">
          <div className="drill-title">
            <h2 className="t-h4">{name}</h2>
            <Badge variant={item.mode === 'targeted' ? 'accent' : 'default'}>
              {modeBadgeText(item)}
            </Badge>
          </div>
          {item.status === 'running' && <Badge variant="info">Running</Badge>}
          {item.status === 'done' && (
            <Badge variant="success">Done · {plural(item.detected, 'shot')}</Badge>
          )}
        </div>

        {item.mode === 'targeted' && item.targetArea && (
          <div className="drill-target">
            <AreaThumb area={item.targetArea} cones={item.cones} />
            <div>
              <p className="t-overline-sm text-2">Aiming for</p>
              <p className="t-label">{areaLabel(item.targetArea)}</p>
            </div>
          </div>
        )}

        {item.status === 'running' && <RunProgress item={item} />}

        {!locked && (
          <>
            <AmountControl
              amount={item.amount}
              lastCount={state.lastCounts[item.id] ?? DEFAULT_COUNT}
              onChange={(amount) => actions.setItemAmount(item.id, amount)}
            />
            <div className="drill-actions">
              <div className="drill-actions-group">
                <IconButton
                  variant="ghost"
                  label={`Move ${name} up`}
                  disabled={!canMove(cart, index, -1)}
                  onClick={() => actions.moveItem(item.id, -1)}
                >
                  <Icon name="keyboard_arrow_up" size={28} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  label={`Move ${name} down`}
                  disabled={!canMove(cart, index, 1)}
                  onClick={() => actions.moveItem(item.id, 1)}
                >
                  <Icon name="keyboard_arrow_down" size={28} />
                </IconButton>
              </div>
              <div className="drill-actions-group">
                <IconButton variant="ghost" label={`Repeat ${name}`} onClick={() => actions.redoItem(item.id)}>
                  <Icon name="replay" size={24} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  className="icon-btn-destructive"
                  label={`Delete ${name}`}
                  onClick={() => actions.deleteItem(item.id)}
                >
                  <Icon name="delete" size={24} />
                </IconButton>
              </div>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

export function CartScreen() {
  const { state, actions } = useTraining();
  const session = state.session;
  const emptied = session?.phase === 'building' && session.cart.length === 0;
  useWakeLock(session?.phase === 'running');
  useEffect(() => {
    if (emptied) actions.emptiedCart();
  }, [emptied, actions]);
  if (!session || emptied) return null;
  const { cart } = session;
  const full = cart.length >= MAX_DRILLS;
  const hasUpcoming = cart.some((item) => item.status === 'upcoming');
  const upcoming = cart.filter((item) => item.status === 'upcoming').length;
  const startable = (session.phase === 'building' || session.phase === 'idle') && hasUpcoming;
  const finished = session.phase === 'idle' && !hasUpcoming;

  return (
    <main className="screen">
      <PageHeader title="Shot List" subtitle="Shots play from top to bottom" onBack={actions.cartBack} />
      <div className="screen-body">
        <ol className="timeline list-reset">
          {cart.map((item, index) => (
            <DrillCard key={item.id} item={item} index={index} cart={cart} />
          ))}
        </ol>
        <button type="button" className="add-shot t-h4" disabled={full} onClick={actions.openAdd}>
          <Icon name="add" size={26} /> Add shot
        </button>
        {full && <p className="t-body-sm text-2 center">List is full</p>}
        {finished && <p className="t-body-b text-2 center">All drills done</p>}
      </div>
      <footer className="float-bar">
        <div className="float-info">
          <p className="t-overline text-2">In list</p>
          <p className="t-h4">
            {plural(cart.length, 'drill')}
            {session.phase !== 'building' && upcoming > 0 && ` · ${upcoming} to go`}
          </p>
        </div>
        {startable || session.phase === 'building' ? (
          <Button icon={<Icon name="play_arrow" size={26} />} disabled={!startable} onClick={actions.start}>
            Start
          </Button>
        ) : (
          <Button variant="accent" icon={<Icon name="stop" size={26} />} onClick={actions.requestEnd}>
            End Session
          </Button>
        )}
      </footer>
    </main>
  );
}

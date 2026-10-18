import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import type { CartItem } from '../domain/types.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { canMove, DEFAULT_COUNT, MAX_DRILLS } from '../store/reducer.ts';
import { AmountControl } from '../ui/AmountControl.tsx';
import { Badge, Button, IconButton } from '../ui/controls.tsx';
import { amountLabel, modeBadgeText, plural } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { ZoneThumb } from '../ui/ZoneThumb.tsx';

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

        {item.mode === 'targeted' && item.targetZone && (
          <div className="drill-target">
            <ZoneThumb zone={item.targetZone} />
            <div>
              <p className="t-overline-sm text-2">Aiming for</p>
              <p className="t-label">{getZone(item.targetZone).label}</p>
            </div>
          </div>
        )}

        {item.status === 'running' && <p className="t-body-b text-2">{amountLabel(item.amount)}</p>}

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
  useEffect(() => {
    if (emptied) actions.emptiedCart();
  }, [emptied, actions]);
  if (!session || emptied) return null;
  const { cart } = session;
  const full = cart.length >= MAX_DRILLS;
  const canStart = session.phase === 'paused' || cart.some((item) => item.status === 'upcoming');
  const upcoming = cart.filter((item) => item.status === 'upcoming').length;

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
      </div>
      <footer className="float-bar">
        <div className="float-info">
          <p className="t-overline text-2">In list</p>
          <p className="t-h4">
            {plural(cart.length, 'drill')}
            {session.phase !== 'building' && upcoming > 0 && ` · ${upcoming} to go`}
          </p>
        </div>
        <Button icon={<Icon name="play_arrow" size={26} />} disabled={!canStart} onClick={actions.start}>
          Start
        </Button>
      </footer>
    </main>
  );
}

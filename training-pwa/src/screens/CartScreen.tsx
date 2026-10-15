import { shotLabel } from '../domain/catalog.ts';
import type { CartItem } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { canMove, DEFAULT_COUNT, MAX_DRILLS } from '../store/reducer.ts';
import { AmountControl } from '../ui/AmountControl.tsx';
import { Badge, Button, IconButton } from '../ui/controls.tsx';
import { amountLabel, modeBadgeText, plural } from '../ui/format.ts';
import { ChevronDown, ChevronUp, Play, Plus, Repeat, Trash } from '../ui/icons.tsx';
import { NavBar } from '../ui/NavBar.tsx';

function DrillCard({ item, index, cart }: { item: CartItem; index: number; cart: CartItem[] }) {
  const { state, actions } = useTraining();
  const locked = item.status !== 'upcoming';
  const name = shotLabel(item.shotId);

  return (
    <li className={`card drill${locked ? ' drill-locked' : ''}`}>
      <div className="drill-head">
        <span className="drill-num t-label-sm">{index + 1}</span>
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
                <ChevronUp />
              </IconButton>
              <IconButton
                variant="ghost"
                label={`Move ${name} down`}
                disabled={!canMove(cart, index, 1)}
                onClick={() => actions.moveItem(item.id, 1)}
              >
                <ChevronDown />
              </IconButton>
            </div>
            <div className="drill-actions-group">
              <IconButton variant="ghost" label={`Repeat ${name}`} onClick={() => actions.redoItem(item.id)}>
                <Repeat />
              </IconButton>
              <IconButton
                variant="ghost"
                className="icon-btn-destructive"
                label={`Delete ${name}`}
                onClick={() => actions.deleteItem(item.id)}
              >
                <Trash />
              </IconButton>
            </div>
          </div>
        </>
      )}
    </li>
  );
}

export function CartScreen() {
  const { state, actions } = useTraining();
  const session = state.session;
  if (!session) return null;
  const { cart } = session;
  const full = cart.length >= MAX_DRILLS;
  const canStart = session.phase === 'paused' || cart.some((item) => item.status === 'upcoming');

  return (
    <main className="screen">
      <NavBar title="Shot Cart" subtitle="Shots play from top to bottom" onBack={actions.cartBack} />
      <div className="screen-body">
        {cart.length === 0 ? (
          <div className="empty">
            <p className="t-h3">Add your first shot</p>
            <Button icon={<Plus />} onClick={actions.openAdd}>
              Add shot
            </Button>
          </div>
        ) : (
          <>
            <ol className="stack-12 list-reset">
              {cart.map((item, index) => (
                <DrillCard key={item.id} item={item} index={index} cart={cart} />
              ))}
            </ol>
            <button type="button" className="add-shot t-h4" disabled={full} onClick={actions.openAdd}>
              <Plus /> Add shot
            </button>
            {full && <p className="t-body-sm text-2 center">Cart is full</p>}
          </>
        )}
      </div>
      <footer className="bar-bottom row-between">
        <div>
          <p className="t-overline text-2">In cart</p>
          <p className="t-h4">{plural(cart.length, 'drill')}</p>
        </div>
        <Button icon={<Play />} disabled={!canStart} onClick={actions.start}>
          Start
        </Button>
      </footer>
    </main>
  );
}

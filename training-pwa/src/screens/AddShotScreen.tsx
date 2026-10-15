import { SHOTS } from '../domain/catalog.ts';
import type { Mode } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { MAX_DRILLS } from '../store/reducer.ts';
import { Button, Chip, Tabs } from '../ui/controls.tsx';
import { Bolt, ChevronRight, Target } from '../ui/icons.tsx';
import { plural } from '../ui/format.ts';
import { NavBar } from '../ui/NavBar.tsx';

const MODES: { value: Mode; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'targeted', label: 'Targeted' },
];

export const STEPS: Record<Mode, string[]> = {
  free: ['Shot', 'Amount'],
  targeted: ['Shot', 'Target', 'Amount'],
};

export function AddShotScreen() {
  const { state, actions } = useTraining();
  const { draft, sheet, session } = state;
  const cart = session?.cart ?? [];
  const full = cart.length >= MAX_DRILLS;

  return (
    <main className="screen">
      <NavBar
        title="Add a Shot"
        subtitle="Add as many as you like, then view your cart"
        onBack={actions.viewCart}
        steps={{ current: 0, labels: STEPS[draft.mode] }}
      />
      <div className="screen-body">
        <Tabs label="Training mode" value={draft.mode} options={MODES} onChange={actions.setMode} />
        <div className="mode-note">
          <span className="mode-note-icon">{draft.mode === 'free' ? <Bolt /> : <Target />}</span>
          <p className="t-body-sm">
            {draft.mode === 'free'
              ? 'Hit anywhere. The camera tracks where every shot lands.'
              : 'Pick a zone to aim for. Every shot is scored as a hit or a miss.'}
          </p>
        </div>
        <div className="shot-grid">
          {SHOTS.map((shot) => {
            const inCart = cart.filter((item) => item.shotId === shot.id).length;
            return (
              <Chip
                key={shot.id}
                block
                selected={sheet === 'amount' && draft.shotId === shot.id}
                onClick={() => actions.pickShot(shot.id)}
              >
                {shot.label}
                {shot.alias && <span className="chip-alias t-caption">{shot.alias}</span>}
                {inCart > 0 && <span className="chip-count t-caption-b">{inCart}</span>}
              </Chip>
            );
          })}
        </div>
        {full && <p className="t-body-sm text-2 center">Cart is full</p>}
      </div>
      <footer className="bar-bottom bar-dark row-between">
        <div>
          <p className="t-overline">In cart</p>
          <p className="t-h4">{plural(cart.length, 'drill')}</p>
        </div>
        <Button variant="accent" icon={<ChevronRight />} onClick={actions.viewCart}>
          View cart
        </Button>
      </footer>
    </main>
  );
}

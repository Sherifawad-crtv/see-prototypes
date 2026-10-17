import { SHOTS } from '../domain/catalog.ts';
import type { Mode } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { MAX_DRILLS } from '../store/reducer.ts';
import { Button, Tabs } from '../ui/controls.tsx';
import { plural } from '../ui/format.ts';
import { Icon, type IconName } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';

const MODES: { value: Mode; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'targeted', label: 'Targeted' },
];

export const STEPS: Record<Mode, string[]> = {
  free: ['Shot', 'Amount'],
  targeted: ['Shot', 'Target', 'Amount'],
};

const SHOT_ICONS: Record<string, IconName> = {
  serve: 'sports_tennis',
  groundstroke: 'swap_horiz',
  volley: 'bolt',
  overhead: 'keyboard_double_arrow_up',
  lob: 'rocket_launch',
};

export function AddShotScreen() {
  const { state, actions } = useTraining();
  const { draft, sheet, session } = state;
  const cart = session?.cart ?? [];
  const full = cart.length >= MAX_DRILLS;

  return (
    <main className="screen">
      <PageHeader
        title="Add a Shot"
        subtitle="Add as many as you like, then view your cart"
        onBack={actions.addBack}
        steps={{ current: 0, labels: STEPS[draft.mode] }}
      />
      <div className="screen-body">
        <Tabs label="Training mode" value={draft.mode} options={MODES} onChange={actions.setMode} />
        <div className="mode-note">
          <span className="mode-note-icon">
            <Icon name={draft.mode === 'free' ? 'bolt' : 'my_location'} size={22} />
          </span>
          <p className="t-body-sm">
            {draft.mode === 'free'
              ? 'Hit anywhere. The camera tracks where every shot lands.'
              : 'Pick a zone to aim for. Every shot is scored as a hit or a miss.'}
          </p>
        </div>
        <div className="shot-grid">
          {SHOTS.map((shot) => {
            const inCart = cart.filter((item) => item.shotId === shot.id).length;
            const selected = sheet === 'amount' && draft.shotId === shot.id;
            return (
              <button
                key={shot.id}
                type="button"
                aria-pressed={selected}
                className={`shot-tile${selected ? ' shot-tile-on' : ''}`}
                onClick={() => actions.pickShot(shot.id)}
              >
                <span className="t-stat-sm shot-tile-name">{shot.label}</span>
                <span className="t-body-sm text-2 shot-tile-caption">{shot.alias ?? 'Shot'}</span>
                {inCart > 0 && <span className="chip-count t-caption-b">{inCart}</span>}
                <Icon name={SHOT_ICONS[shot.id] ?? 'sports_tennis'} size={72} className="tile-icon" />
              </button>
            );
          })}
        </div>
        {full && <p className="t-body-sm text-2 center">Cart is full</p>}
      </div>
      <footer className="float-bar">
        <div className="float-info">
          <p className="t-overline text-2">In cart</p>
          <p className="t-h4">{plural(cart.length, 'drill')}</p>
        </div>
        <Button
          icon={<Icon name="arrow_forward" size={24} />}
          disabled={cart.length === 0}
          onClick={actions.viewCart}
        >
          View cart
        </Button>
      </footer>
    </main>
  );
}

import { SHOTS } from '../domain/catalog.ts';
import type { Mode } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { MAX_DRILLS } from '../store/reducer.ts';
import { Button, Tabs } from '../ui/controls.tsx';
import { plural } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';

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
      <PageHeader
        title="Add a Shot"
        subtitle="Add as many as you like, then view your list"
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
        <div className="shot-list">
          {SHOTS.map((shot) => {
            const inList = cart.filter((item) => item.shotId === shot.id).length;
            const selected = sheet === 'amount' && draft.shotId === shot.id;
            return (
              <button
                key={shot.id}
                type="button"
                aria-pressed={selected}
                className={`shot-row${selected ? ' shot-row-on' : ''}`}
                onClick={() => actions.pickShot(shot.id)}
              >
                <span className="shot-row-name t-label-lg">{shot.label}</span>
                {inList > 0 && <span className="count-badge t-caption-b">{inList}</span>}
                <Icon name="chevron_right" size={28} />
              </button>
            );
          })}
        </div>
        {full && <p className="t-body-sm text-2 center">List is full</p>}
      </div>
      <footer className="float-bar">
        <div className="float-info">
          <p className="t-overline text-2">In list</p>
          <p className="t-h4">{plural(cart.length, 'drill')}</p>
        </div>
        <Button
          icon={<Icon name="arrow_forward" size={24} />}
          disabled={cart.length === 0}
          onClick={actions.viewCart}
        >
          View list
        </Button>
      </footer>
    </main>
  );
}

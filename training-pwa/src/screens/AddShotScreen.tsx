import { CATEGORIES, SHOTS } from '../domain/catalog.ts';
import type { Mode } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Chip, Tabs } from '../ui/controls.tsx';
import { Bolt, Target } from '../ui/icons.tsx';
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
  const { draft, sheet } = state;

  return (
    <main className="screen">
      <NavBar
        title="Add a Shot"
        subtitle="Pick one shot type to add"
        onBack={actions.back}
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
        {CATEGORIES.map((category, index) => (
          <section key={category} className="category">
            <h2 className="category-title">
              <span className="t-stat-sm category-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="t-overline text-2">{category}</span>
            </h2>
            <div className="chip-row">
              {SHOTS.filter((shot) => shot.category === category).map((shot) => (
                <Chip
                  key={shot.id}
                  selected={sheet === 'amount' && draft.shotId === shot.id}
                  onClick={() => actions.pickShot(shot.id)}
                >
                  {shot.label}
                  {shot.alias && <span className="chip-alias t-caption">{shot.alias}</span>}
                </Chip>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

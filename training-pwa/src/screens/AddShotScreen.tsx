import { CATEGORIES, SHOTS } from '../domain/catalog.ts';
import type { Mode } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Chip, Tabs } from '../ui/controls.tsx';
import { NavBar } from '../ui/NavBar.tsx';

const MODES: { value: Mode; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'targeted', label: 'Targeted' },
];

export function AddShotScreen() {
  const { state, actions } = useTraining();
  const { draft, sheet } = state;

  return (
    <main className="screen">
      <NavBar title="Add a Shot" subtitle="Pick one shot type to add" onBack={actions.back} />
      <div className="screen-body">
        <Tabs label="Training mode" value={draft.mode} options={MODES} onChange={actions.setMode} />
        {CATEGORIES.map((category) => (
          <section key={category} className="stack-8">
            <h2 className="t-overline text-2 section-title">{category}</h2>
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

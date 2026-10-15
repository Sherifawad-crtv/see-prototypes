import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Button } from '../ui/controls.tsx';
import { Court } from '../ui/Court.tsx';
import { NavBar } from '../ui/NavBar.tsx';

export function TargetScreen() {
  const { state, actions } = useTraining();
  const { draft } = state;
  if (!draft.shotId) return null;

  return (
    <main className="screen">
      <NavBar
        title={`Where should your ${shotLabel(draft.shotId)} land?`}
        subtitle="Tap one zone"
        onBack={actions.back}
      />
      <div className="screen-body">
        <div className="court-frame">
          <Court
            mode="select"
            view="half"
            selectedZone={draft.targetZone}
            onSelectZone={actions.setZone}
          />
        </div>
        <p className="t-h4 zone-caption" aria-live="polite">
          {draft.targetZone ? getZone(draft.targetZone).label : ''}
        </p>
      </div>
      <footer className="bar-bottom">
        <Button full disabled={!draft.targetZone} onClick={actions.confirmTarget}>
          Continue
        </Button>
      </footer>
    </main>
  );
}

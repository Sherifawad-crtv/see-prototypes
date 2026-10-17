import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Button } from '../ui/controls.tsx';
import { Court } from '../ui/Court.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { STEPS } from './AddShotScreen.tsx';

export function TargetScreen() {
  const { state, actions } = useTraining();
  const { draft } = state;
  if (!draft.shotId) return null;

  return (
    <main className="screen">
      <PageHeader
        title={`Where should your ${shotLabel(draft.shotId)} land?`}
        subtitle="Tap one zone"
        onBack={actions.back}
        steps={{ current: 1, labels: STEPS.targeted }}
      />
      <div className="screen-body">
        <div className="court-stage">
          <Court
            mode="select"
            view="half"
            selectedZone={draft.targetZone}
            onSelectZone={actions.setZone}
          />
        </div>
        <p className="t-h3 center zone-caption" aria-live="polite">
          {draft.targetZone ? getZone(draft.targetZone).label : 'No zone picked yet'}
        </p>
        <p className="t-caption text-2 center">The net is at the bottom of the court.</p>
      </div>
      <footer className="float-bar">
        <Button full disabled={!draft.targetZone} onClick={actions.confirmTarget}>
          Continue
        </Button>
      </footer>
    </main>
  );
}

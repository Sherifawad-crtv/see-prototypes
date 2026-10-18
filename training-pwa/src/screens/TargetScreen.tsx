import { shotLabel } from '../domain/catalog.ts';
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
        subtitle="Drag on the court to draw your target"
        onBack={actions.back}
        steps={{ current: 1, labels: STEPS.targeted }}
      />
      <div className="screen-body">
        <div className="court-stage">
          <Court mode="select" view="half" area={draft.targetArea} onAreaChange={actions.setArea} />
        </div>
        <p className="t-caption text-2 center" aria-live="polite">
          {draft.targetArea
            ? 'Drag the box to move it. Pull the squares to resize it.'
            : 'Press and drag to draw a box, or tap for a standard one.'}
        </p>
      </div>
      <footer className="float-bar float-bar-pair">
        <Button full disabled={!draft.targetArea} onClick={actions.confirmTarget}>
          Continue
        </Button>
      </footer>
    </main>
  );
}

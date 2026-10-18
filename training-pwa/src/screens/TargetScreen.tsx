import { useState } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Button, Tabs } from '../ui/controls.tsx';
import { Court, MAX_CONES } from '../ui/Court.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { STEPS } from './AddShotScreen.tsx';

type Tool = 'frame' | 'cones';

export function TargetScreen() {
  const { state, actions } = useTraining();
  const { draft } = state;
  const [tool, setTool] = useState<Tool>('frame');
  if (!draft.shotId) return null;

  const hint =
    tool === 'cones'
      ? draft.cones.length
        ? 'Tap the court to add a cone. Tap a cone to remove it.'
        : 'Tap the court to place a cone.'
      : draft.targetArea
        ? 'Drag the box to move it. Pull the squares to resize it.'
        : 'Press and drag to draw a box, or tap for a standard one.';

  return (
    <main className="screen">
      <PageHeader
        title={`Where should your ${shotLabel(draft.shotId)} land?`}
        subtitle="Draw your target and place cones if you use them"
        onBack={actions.back}
        steps={{ current: 1, labels: STEPS.targeted }}
      />
      <div className="screen-body">
        <Tabs
          label="Tool"
          value={tool}
          onChange={setTool}
          options={[
            { value: 'frame', label: 'Frame' },
            { value: 'cones', label: `Cones${draft.cones.length ? ` · ${draft.cones.length}` : ''}` },
          ]}
        />
        <div className="court-stage">
          <Court
            mode="select"
            view="half"
            tool={tool}
            area={draft.targetArea}
            onAreaChange={actions.setArea}
            cones={draft.cones}
            onConesChange={actions.setCones}
          />
        </div>
        <p className="t-caption text-2 center" aria-live="polite">
          {hint}
        </p>
        <div className="tool-actions">
          {tool === 'frame' ? (
            <Button variant="secondary" disabled={!draft.targetArea} onClick={() => actions.setArea(null)}>
              Remove frame
            </Button>
          ) : (
            <Button variant="secondary" disabled={!draft.cones.length} onClick={() => actions.setCones([])}>
              {draft.cones.length >= MAX_CONES ? 'Remove all cones (max)' : 'Remove all cones'}
            </Button>
          )}
        </div>
      </div>
      <footer className="float-bar float-bar-pair">
        <Button full disabled={!draft.targetArea} onClick={actions.confirmTarget}>
          Continue
        </Button>
      </footer>
    </main>
  );
}

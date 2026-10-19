import { useState } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { isComplete, MAX_ZONES, ZONE_MIN_CONES, zonesReady } from '../domain/court.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Button, Chip } from '../ui/controls.tsx';
import { Court } from '../ui/Court.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { STEPS } from './AddShotScreen.tsx';

export function TargetScreen() {
  const { state, actions } = useTraining();
  const { draft } = state;
  const [active, setActive] = useState(0);
  if (!draft.shotId) return null;

  const zones = draft.zones.length ? draft.zones : [[]];
  const current = Math.min(active, zones.length - 1);
  const zone = zones[current];
  const ready = zonesReady(zones);
  const unfinished = zones.findIndex((z) => z.length > 0 && !isComplete(z));

  const hint = unfinished >= 0
    ? `Zone ${unfinished + 1} needs ${ZONE_MIN_CONES - zones[unfinished].length} more cone${ZONE_MIN_CONES - zones[unfinished].length === 1 ? '' : 's'} to join into a shape.`
    : zone.length === 0
      ? `Tap the court to place cones. From ${ZONE_MIN_CONES} cones on, they join into a shape.`
      : 'Tap to add more cones, or tap a cone to remove it. Add another zone to aim at a second spot.';

  const removeZone = () => {
    const next = zones.filter((_, i) => i !== current);
    actions.setZones(next);
    setActive(Math.max(0, current - 1));
  };

  return (
    <main className="screen">
      <PageHeader
        title={`Where should your ${shotLabel(draft.shotId)} land?`}
        subtitle="Place your cones. Each set becomes a target zone"
        onBack={actions.back}
        steps={{ current: 1, labels: STEPS.targeted }}
      />
      <div className="screen-body">
        <div className="zone-chips" data-tour="zones" role="group" aria-label="Zones">
          {zones.map((z, i) => (
            <Chip key={i} selected={i === current} onClick={() => setActive(i)}>
              {`Zone ${i + 1} · ${z.length}`}
            </Chip>
          ))}
          {zones.length < MAX_ZONES && (
            <Chip
              onClick={() => {
                actions.setZones([...zones, []]);
                setActive(zones.length);
              }}
            >
              + Add zone
            </Chip>
          )}
        </div>
        <div className="court-stage" data-tour="court">
          <Court mode="select" view="half" zones={zones} activeZone={current} onZonesChange={actions.setZones} />
        </div>
        <p className="t-caption text-2 center" aria-live="polite">
          {hint}
        </p>
        <div className="tool-actions">
          <Button variant="secondary" disabled={zones.length === 1 && zone.length === 0} onClick={removeZone}>
            {zones.length > 1 ? 'Remove zone' : 'Clear cones'}
          </Button>
        </div>
      </div>
      <footer className="float-bar float-bar-pair">
        <Button full data-tour="continue" disabled={!ready} onClick={actions.confirmTarget}>
          Continue
        </Button>
      </footer>
    </main>
  );
}

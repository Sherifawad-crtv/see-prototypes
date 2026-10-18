import { activity, onTarget, summarise, totals } from '../domain/stats.ts';
import type { Session, Zone } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { ColorBlock, Gauge, Panel, Tile } from '../ui/blocks.tsx';
import { Button } from '../ui/controls.tsx';
import { Court, type CourtDot } from '../ui/Court.tsx';
import { formatDurationClock } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';

function ResultsBody({ session }: { session: Session }) {
  const sums = totals(session);
  const summary = summarise(session);
  const scored = sums.targeted > 0;
  const scoredStats = onTarget(session);
  const hitPct = scoredStats.pct;
  const effort = activity(session);
  const shotTypes = new Set(session.shots.map((shot) => shot.shotId)).size;
  const outOfBounds = session.shots.filter((shot) => !shot.inBounds).length;
  const mixed = sums.free > 0 && sums.targeted > 0;

  const dots: CourtDot[] = session.shots.map((shot) => ({
    id: shot.id,
    shotId: shot.shotId,
    x: shot.landing.x,
    y: shot.landing.y,
    inBounds: shot.inBounds,
    hit: shot.hit,
  }));

  const zones: Zone[] = session.cart
    .filter((item) => session.shots.some((shot) => shot.cartItemId === item.id))
    .flatMap((item) => item.zones ?? []);

  return (
    <>
      {sums.total === 0 ? (
        <div className="empty-hero">
          <div className="empty-art" aria-hidden="true">
            <Icon name="sports_tennis" size={56} />
          </div>
          <p className="t-display-sm">No shots detected</p>
          <p className="t-body text-2">The camera did not pick up any shots in this session.</p>
        </div>
      ) : (
        <>
          {scored ? (
              <div className="gauges">
                <Gauge tone="blue" label="Hits" value={hitPct} display={scoredStats.hits} />
                <Gauge
                  tone="orange"
                  label="Misses"
                  value={100 - hitPct}
                  display={scoredStats.total - scoredStats.hits}
                />
              </div>
            ) : (
              <div className="blocks">
                <ColorBlock
                  wide
                  tone="blue"
                  label="DURATION"
                  value={formatDurationClock(summary.durationSec)}
                  unit="min"
                  icon="schedule"
                />
                <ColorBlock
                  tone="blue"
                  label="DISTANCE COVERED"
                  value={effort.distanceKm.toFixed(2)}
                  unit="Km"
                  shape="swoosh"
                />
                <ColorBlock tone="orange" label="TOTAL CALORIES" value={effort.calories} unit="KCAL" shape="flame" />
              </div>
            )}

          <Panel icon="my_location" title="Shot Placement" subtitle="Where your shots landed on court">
            <div className="court-stage">
              <Court mode="results" view="full" dots={dots} zones={zones} />
            </div>
            {sums.targeted > 0 && (
              <div className="court-legend t-caption">
                <span className="legend-item">
                  <span className="legend-dot legend-hit" /> Hit
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-miss" /> Miss
                </span>
              </div>
            )}
          </Panel>

          <div className="tiles tiles-compact">
            <Tile label="Total shots" value={sums.total} />
            <Tile label="Shot types" value={shotTypes} />
            {mixed && <Tile label="Free shots" value={sums.free} />}
            {mixed && <Tile label="Targeted shots" value={sums.targeted} />}
            <Tile label="Out of bounds" value={outOfBounds} />
          </div>
        </>
      )}
    </>
  );
}

export function ResultsScreen() {
  const { state, actions } = useTraining();
  const session = state.viewing;

  return (
    <main className="screen">
      <PageHeader title="Results" onBack={actions.back} />
      <div className="screen-body">{session && <ResultsBody key={session.id} session={session} />}</div>
      <footer className="float-bar float-bar-pair">
        <Button variant="secondary" onClick={actions.back}>
          Done
        </Button>
        <Button icon={<Icon name="replay" size={24} />} onClick={actions.trainAgain}>
          Train again
        </Button>
      </footer>
    </main>
  );
}

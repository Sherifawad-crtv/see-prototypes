import { summarise, totals } from '../domain/stats.ts';
import type { Session } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { ColorBlock, Panel } from '../ui/blocks.tsx';
import { Button } from '../ui/controls.tsx';
import { Court, type CourtDot, type CourtZone } from '../ui/Court.tsx';
import { formatDate, formatDurationClock } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';

function ResultsBody({ session }: { session: Session }) {
  const sums = totals(session);
  const summary = summarise(session);
  const headline = sums.free > 0 && sums.targeted > 0 ? 'Mixed session' : sums.targeted > 0 ? 'Targeted session' : 'Free session';

  const dots: CourtDot[] = session.shots.map((shot) => ({
    id: shot.id,
    shotId: shot.shotId,
    x: shot.landing.x,
    y: shot.landing.y,
    inBounds: shot.inBounds,
    hit: shot.hit,
  }));

  const zones = new Map<string, CourtZone>();
  for (const item of session.cart) {
    if (item.mode === 'targeted' && item.targetZone && session.shots.some((shot) => shot.cartItemId === item.id)) {
      zones.set(item.targetZone, { id: item.targetZone, emphasis: 'outline' });
    }
  }

  return (
    <>
      <section className="wash-card result-hero">
        <p className="t-body-sm text-2">{formatDate(session.startedAt)}</p>
        <h2 className="t-display-md">{sums.total === 0 ? 'Session recap' : headline}</h2>
      </section>

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
          <div className="blocks">
            <ColorBlock tone="blue" label="TOTAL SHOTS" value={sums.total} shape="swoosh" />
            <ColorBlock
              tone="orange"
              label="DURATION"
              value={formatDurationClock(summary.durationSec)}
              unit="min"
              shape="flame"
            />
          </div>

          <Panel icon="my_location" title="Shot Placement" subtitle="Where your shots landed on court">
            <div className="court-stage">
              <Court mode="results" view="full" dots={dots} zones={[...zones.values()]} />
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

import { useMemo, useState } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import {
  distribution,
  insight,
  onTarget,
  shotsInMode,
  summarise,
  totals,
} from '../domain/stats.ts';
import type { Mode, Session } from '../domain/types.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Chip, IconButton, ProgressBar, StatCard, Tabs } from '../ui/controls.tsx';
import { Court, type CourtDot, type CourtZone } from '../ui/Court.tsx';
import { formatDate, formatDuration, formatDurationClock, plural } from '../ui/format.ts';
import { Bulb, ChevronLeft } from '../ui/icons.tsx';
import { Ring } from '../ui/Ring.tsx';
import { ZoneThumb } from '../ui/ZoneThumb.tsx';

const MODES: { value: Mode; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'targeted', label: 'Targeted' },
];

function ResultsBody({ session }: { session: Session }) {
  const sums = totals(session);
  const summary = summarise(session);
  const hasBoth = sums.free > 0 && sums.targeted > 0;
  const [chosen, setChosen] = useState<Mode>('free');
  const mode: Mode = hasBoth ? chosen : sums.targeted > 0 ? 'targeted' : 'free';
  const [filter, setFilter] = useState<string>('all');

  const rows = useMemo(() => distribution(session, mode), [session, mode]);
  const target = useMemo(() => onTarget(session), [session]);
  const line = useMemo(() => insight(session), [session]);
  const activeFilter = filter === 'all' || rows.some((row) => row.shotId === filter) ? filter : 'all';
  const targeted = mode === 'targeted';

  const modeShots = shotsInMode(session, mode).filter(
    (shot) => activeFilter === 'all' || shot.shotId === activeFilter,
  );
  const dots: CourtDot[] = modeShots.map((shot) => ({
    id: shot.id,
    shotId: shot.shotId,
    x: shot.landing.x,
    y: shot.landing.y,
    inBounds: shot.inBounds,
    hit: shot.hit,
  }));

  const zoneMap = new Map<string, CourtZone>();
  if (targeted) {
    for (const item of session.cart) {
      if (item.mode !== 'targeted' || !item.targetZone) continue;
      if (!session.shots.some((shot) => shot.cartItemId === item.id)) continue;
      if (activeFilter !== 'all' && item.shotId !== activeFilter) continue;
      zoneMap.set(item.targetZone, {
        id: item.targetZone,
        emphasis: activeFilter === 'all' ? 'outline' : 'target',
      });
    }
  }

  const modeTotal = mode === 'free' ? sums.free : sums.targeted;
  const totalLabel = hasBoth ? (targeted ? 'Targeted shots' : 'Free shots') : 'Total shots';
  const headline = hasBoth ? 'Mixed session' : sums.targeted > 0 ? 'Targeted session' : 'Free session';

  return (
    <>
      <section className="hero-panel result-hero">
        <div className="result-hero-text">
          <p className="t-overline hero-kicker">{formatDate(session.startedAt)}</p>
          <h2 className="t-display-md">{sums.total === 0 ? 'Session recap' : headline}</h2>
          <p className="t-body-sm hero-copy">
            {formatDuration(summary.durationSec)} · {plural(sums.total, 'shot')} in total
            {hasBoth && ` (Free ${sums.free} · Targeted ${sums.targeted})`}
          </p>
        </div>
        {targeted && sums.total > 0 && <Ring value={target.pct} label="On target" caption="On target" />}
      </section>

      {sums.total === 0 ? (
        <div className="empty-hero">
          <div className="empty-art" aria-hidden="true" />
          <p className="t-display-sm">No shots detected</p>
          <p className="t-body text-2">The camera did not pick up any shots in this session.</p>
        </div>
      ) : (
        <>
          {hasBoth && (
            <Tabs label="Results mode" value={mode} options={MODES} onChange={setChosen} />
          )}

          <div className="hero">
            {targeted && (
              <StatCard
                variant="brand"
                label="On target"
                value={target.hits}
                suffix={`/ ${target.total}`}
                delta={`${target.pct}%`}
              />
            )}
            <StatCard label={totalLabel} value={modeTotal} />
            {!targeted && (
              <StatCard
                label="Duration"
                value={formatDurationClock(summary.durationSec)}
                delta="min : sec"
              />
            )}
          </div>

          <section className="court-card">
            <div>
              <h2 className="t-h4">Shot Placement</h2>
              <p className="t-body-sm text-2">Where your shots landed on court</p>
            </div>
            <div className="chip-row">
              <Chip selected={activeFilter === 'all'} onClick={() => setFilter('all')}>
                All
              </Chip>
              {rows.map((row) => (
                <Chip
                  key={row.shotId}
                  selected={activeFilter === row.shotId}
                  onClick={() => setFilter(row.shotId)}
                >
                  {shotLabel(row.shotId)}
                </Chip>
              ))}
            </div>
            <div className="court-stage">
              <Court
                mode="results"
                view="full"
                dots={dots}
                zones={[...zoneMap.values()]}
                targeted={targeted}
              />
            </div>
            {targeted && (
              <div className="court-legend t-caption">
                <span className="legend-item">
                  <span className="legend-dot legend-hit" /> Hit
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-miss" /> Miss
                </span>
              </div>
            )}
          </section>

          {targeted && (
            <section className="card stack-12">
              <h2 className="t-h4">By shot type</h2>
              {target.byShot.map((row) => (
                <div key={row.shotId} className="target-row">
                  {row.zones[0] && <ZoneThumb zone={row.zones[0]} />}
                  <div className="target-row-main">
                    <div className="row-between">
                      <span className="t-label">{shotLabel(row.shotId)}</span>
                      <span className="t-stat-sm">
                        {row.hits} / {row.total} · {row.pct}%
                      </span>
                    </div>
                    <span className="t-body-sm text-2">
                      {row.zones.map((zone) => getZone(zone).label).join(', ')}
                    </span>
                    <ProgressBar label={`${shotLabel(row.shotId)} accuracy`} value={row.pct} />
                  </div>
                </div>
              ))}
            </section>
          )}

          {targeted && line && (
            <p className="insight t-body" role="status">
              <Bulb />
              {line}
            </p>
          )}

          <section className="card stack-16">
            <h2 className="t-h4">Distribution</h2>
            {rows.map((row, index) => (
              <div key={row.shotId} className="dist-row">
                <div className="row-between">
                  <span className="row">
                    <span className="t-stat-sm rank">{index + 1}</span>
                    <span className="t-label">{shotLabel(row.shotId)}</span>
                  </span>
                  <span className="t-stat-sm">
                    {row.count} · {row.pct}%
                  </span>
                </div>
                <ProgressBar label={`${shotLabel(row.shotId)} share`} value={row.pct} />
              </div>
            ))}
          </section>
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
      <div className="topbar">
        <IconButton variant="secondary" label="Back" onClick={actions.back}>
          <ChevronLeft />
        </IconButton>
        <h1 className="topbar-title t-h4">Results</h1>
        <span />
      </div>
      <div className="screen-body">{session && <ResultsBody key={session.id} session={session} />}</div>
    </main>
  );
}

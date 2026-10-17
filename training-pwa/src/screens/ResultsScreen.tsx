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
import { ColorBlock, Donut, Panel } from '../ui/blocks.tsx';
import { Button, Chip, ProgressBar, Tabs } from '../ui/controls.tsx';
import { Court, type CourtDot, type CourtZone } from '../ui/Court.tsx';
import { formatDate, formatDuration, formatDurationClock, plural } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
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
  const totalLabel = hasBoth ? (targeted ? 'TARGETED SHOTS' : 'FREE SHOTS') : 'TOTAL SHOTS';
  const headline = hasBoth ? 'Mixed session' : sums.targeted > 0 ? 'Targeted session' : 'Free session';
  const misses = target.total - target.hits;

  return (
    <>
      <section className="wash-card result-hero">
        <p className="t-body-sm text-2">{formatDate(session.startedAt)}</p>
        <div className="row-between">
          <h2 className="t-display-md">{sums.total === 0 ? 'Session recap' : headline}</h2>
          {summary.onTargetPct !== undefined && (
            <span className="tag-slant t-label-sm">{summary.onTargetPct}%</span>
          )}
        </div>
        <p className="t-body-sm text-2">
          {formatDuration(summary.durationSec)} · {plural(sums.total, 'shot')} in total
          {hasBoth && ` (Free ${sums.free} · Targeted ${sums.targeted})`}
        </p>
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
          {hasBoth && (
            <Tabs label="Results mode" value={mode} options={MODES} onChange={setChosen} />
          )}

          <div className="blocks">
            {targeted ? (
              <ColorBlock
                tone="blue"
                label="ON TARGET"
                value={target.hits}
                unit={`/ ${target.total}`}
                pct={`${target.pct}%`}
                shape="swoosh"
                wide
              />
            ) : (
              <ColorBlock tone="blue" label={totalLabel} value={modeTotal} shape="swoosh" />
            )}
            {targeted ? (
              <>
                <ColorBlock tone="blue" label={totalLabel} value={modeTotal} shape="court" />
                <ColorBlock
                  tone="orange"
                  label="DURATION"
                  value={formatDurationClock(summary.durationSec)}
                  unit="min"
                  shape="flame"
                />
              </>
            ) : (
              <ColorBlock
                tone="orange"
                label="DURATION"
                value={formatDurationClock(summary.durationSec)}
                unit="min"
                shape="flame"
              />
            )}
          </div>

          {targeted && (
            <Panel icon="analytics" title="Accuracy" subtitle="Hits and misses on your target zones">
              <div className="donut-row">
                <Donut a={target.hits} b={misses} aLabel="HITS" bLabel="MISSES" />
                <div className="donut-side">
                  <div className="info-tile">
                    <span className="t-body-sm text-brand">Hits</span>
                    <span className="t-stat-md">{target.hits}</span>
                  </div>
                  <div className="info-tile">
                    <span className="t-body-sm text-orange">Misses</span>
                    <span className="t-stat-md">{misses}</span>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          <Panel icon="my_location" title="Shot Placement" subtitle="Where your shots landed on court">
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
          </Panel>

          {targeted && (
            <Panel icon="target" title="By shot type" subtitle="Accuracy for each target zone">
              {target.byShot.map((row) => (
                <div key={row.shotId} className="player-card">
                  <div className="player-head">
                    {row.zones[0] && <ZoneThumb zone={row.zones[0]} />}
                    <div className="stack-4">
                      <span className="t-h5">{shotLabel(row.shotId)}</span>
                      <span className="t-body-sm text-2">
                        {row.zones.map((zone) => getZone(zone).label).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="player-stats">
                    <span className="stat-cell">
                      <span className="t-overline-sm text-3">Hit</span>
                      <span className="t-stat-sm">{row.hits}</span>
                    </span>
                    <span className="stat-cell">
                      <span className="t-overline-sm text-3">Miss</span>
                      <span className="t-stat-sm">{row.total - row.hits}</span>
                    </span>
                    <span className="stat-cell">
                      <span className="t-overline-sm text-3">Total</span>
                      <span className="t-stat-sm">{row.total}</span>
                    </span>
                  </div>
                  <div className="player-eff">
                    <span className="t-overline-sm text-3">Accuracy</span>
                    <span className="t-stat-sm text-3">{row.pct}%</span>
                  </div>
                  <ProgressBar label={`${shotLabel(row.shotId)} accuracy`} value={row.pct} />
                </div>
              ))}
            </Panel>
          )}

          {targeted && line && (
            <p className="insight t-body" role="status">
              <Icon name="lightbulb" size={24} />
              {line}
            </p>
          )}

          <Panel icon="bar_chart" title="Distribution" subtitle="Shots by type, most played first">
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

import { useEffect, useState } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { distribution, onTarget, totals } from '../domain/stats.ts';
import type { Session, SessionSummary } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Badge, Button, IconButton } from '../ui/controls.tsx';
import { VersusBar } from '../ui/blocks.tsx';
import { formatDuration, plural } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';

function HistoryRow({ summary, onOpen }: { summary: SessionSummary; onOpen: () => void }) {
  const date = new Date(summary.startedAt);
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <button type="button" className="history-row" onClick={onOpen}>
      <span className="date-block">
        <span className="t-stat-md">{date.getDate()}</span>
        <span className="t-overline-sm">{month}</span>
      </span>
      <span className="history-main">
        <span className="t-h5">
          {plural(summary.totalShots, 'shot')} · {formatDuration(summary.durationSec)}
        </span>
        <span className="t-caption text-2">{time}</span>
        {(summary.shotIds.length > 0 || summary.onTargetPct !== undefined) && (
          <span className="pill-row">
            {summary.onTargetPct !== undefined && (
              <Badge variant="brand">On target {summary.onTargetPct}%</Badge>
            )}
            {summary.shotIds.slice(0, 4).map((id) => (
              <Badge key={id}>{shotLabel(id)}</Badge>
            ))}
            {summary.shotIds.length > 4 && <Badge>+{summary.shotIds.length - 4}</Badge>}
          </span>
        )}
      </span>
      <Icon name="chevron_right" size={26} />
    </button>
  );
}

function SessionRecap({ summaries }: { summaries: SessionSummary[] }) {
  const { actions } = useTraining();
  const [index, setIndex] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const current = summaries[Math.min(index, summaries.length - 1)];
  const currentId = current?.id;

  useEffect(() => {
    if (!currentId) return;
    let live = true;
    void actions.loadSession(currentId).then((loaded) => {
      if (live) setSession(loaded);
    });
    return () => {
      live = false;
    };
  }, [actions, currentId]);

  if (!current) return null;
  const date = new Date(current.startedAt);
  const sums = session && session.id === current.id ? totals(session) : null;
  const target = session && sums ? onTarget(session) : null;
  const scored = (target?.total ?? 0) > 0;
  const top = session && sums ? distribution(session, scored ? 'targeted' : 'free').slice(0, 3) : [];
  const outCount = session ? session.shots.filter((shot) => !shot.inBounds).length : 0;
  const hits = target?.hits ?? 0;
  const misses = (target?.total ?? 0) - hits;
  const perShotHits = (shotId: string) => target?.byShot.find((row) => row.shotId === shotId);

  return (
    <section className="wash-card" aria-label="Session recap">
      <div className="pager">
        <IconButton
          variant="secondary"
          label="Older session"
          disabled={index >= summaries.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          <Icon name="chevron_left" size={28} />
        </IconButton>
        <span className="pager-date t-label-lg">
          {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <IconButton
          variant="secondary"
          label="Newer session"
          disabled={index <= 0}
          onClick={() => setIndex(index - 1)}
        >
          <Icon name="chevron_right" size={28} />
        </IconButton>
      </div>
      <p className="t-body-sm text-2 recap-meta">
        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        <span className="recap-sep" />
        <Icon name="schedule" size={18} /> {formatDuration(current.durationSec)}
      </p>

      <div className="recap-card">
        <header className="recap-head">
          <h2 className="t-h4 text-brand">Session Results</h2>
          <span className="tag-slant t-label-sm">
            {current.onTargetPct !== undefined ? `${current.onTargetPct}% ON TARGET` : 'FREE'}
          </span>
        </header>
        <hr className="rule-orange" />
        {sums && (
          <>
            <div className="scoreboard">
              <div className="score-row">
                <span className="t-body text-brand">{scored ? 'Hits' : 'Shots'}</span>
                {top.map((row) => (
                  <span key={row.shotId} className="t-stat-md score-blue" title={shotLabel(row.shotId)}>
                    {scored ? (perShotHits(row.shotId)?.hits ?? 0) : row.count}
                  </span>
                ))}
              </div>
              {scored && (
                <div className="score-row">
                  <span className="t-body text-brand">Misses</span>
                  {top.map((row) => {
                    const entry = perShotHits(row.shotId);
                    return (
                      <span key={row.shotId} className="t-stat-md score-orange" title={shotLabel(row.shotId)}>
                        {entry ? entry.total - entry.hits : 0}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="t-caption text-3 score-legend">
                {top.map((row) => shotLabel(row.shotId)).join(' · ')}
              </p>
            </div>
            <hr className="rule-orange" />
            <div className="versus-list">
              {sums.free > 0 && sums.targeted > 0 && (
                <VersusBar label="Free vs Targeted" left={sums.free} right={sums.targeted} />
              )}
              {scored && <VersusBar label="Hits vs Misses" left={hits} right={misses} />}
              <VersusBar label="In play vs Out" left={sums.total - outCount} right={outCount} />
            </div>
          </>
        )}
        <Button
          full
          icon={<Icon name="arrow_forward" size={22} />}
          className="btn-end-icon"
          onClick={() => void actions.openHistory(current.id)}
        >
          View Results
        </Button>
      </div>
    </section>
  );
}

export function TrainingScreen() {
  const { state, actions } = useTraining();
  const { history } = state;

  return (
    <main className="screen has-nav">
      <div className="screen-body">
        <header className="page-title">
          <h1 className="t-display-md">Training</h1>
          <p className="t-body text-2">Build a cart of drills and train with the camera on.</p>
        </header>

        <Button full variant="accent" icon={<Icon name="play_arrow" size={26} />} onClick={actions.startTraining}>
          Start Training
        </Button>

        {history.length > 0 && <SessionRecap summaries={history} />}

        <div className="row-between section-title">
          <h2 className="t-h3 text-brand">History</h2>
          {history.length > 0 && <span className="t-caption text-2">{plural(history.length, 'session')}</span>}
        </div>
        {history.length === 0 ? (
          <div className="empty-card">
            <p className="t-h5">No sessions yet</p>
            <p className="t-body-sm text-2">Finish your first session and it will show up here.</p>
          </div>
        ) : (
          <div className="stack-8">
            {history.map((summary) => (
              <HistoryRow
                key={summary.id}
                summary={summary}
                onOpen={() => void actions.openHistory(summary.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

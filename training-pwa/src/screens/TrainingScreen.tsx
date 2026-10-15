import { shotLabel } from '../domain/catalog.ts';
import type { SessionSummary } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Badge, Button } from '../ui/controls.tsx';
import { formatDuration, plural } from '../ui/format.ts';
import { ChevronRight, Play } from '../ui/icons.tsx';

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
      <ChevronRight />
    </button>
  );
}

export function TrainingScreen() {
  const { state, actions } = useTraining();
  const { history } = state;
  const withTarget = history.filter((s) => s.onTargetPct !== undefined);
  const average = withTarget.length
    ? Math.round(withTarget.reduce((sum, s) => sum + (s.onTargetPct ?? 0), 0) / withTarget.length)
    : null;

  return (
    <main className="screen">
      <div className="wordmark t-display-sm">
        SEE<span className="wordmark-dot" />
      </div>
      <div className="screen-body">
        <section className="hero-panel">
          <p className="t-overline hero-kicker">Training</p>
          <h1 className="t-display-lg">Every shot, tracked.</h1>
          <p className="t-body hero-copy">
            Build a cart of drills, train with the camera on, then see exactly where each shot landed.
          </p>
          <Button full variant="accent" icon={<Play />} onClick={actions.startTraining}>
            Start Training
          </Button>
        </section>

        {history.length > 0 && (
          <section className="tiles" aria-label="Your totals">
            <div className="tile">
              <span className="t-stat-md">{history.length}</span>
              <span className="t-overline-sm text-2">Sessions</span>
            </div>
            <div className="tile">
              <span className="t-stat-md">{history.reduce((sum, s) => sum + s.totalShots, 0)}</span>
              <span className="t-overline-sm text-2">Shots</span>
            </div>
            <div className="tile">
              <span className="t-stat-md">{average === null ? '–' : `${average}%`}</span>
              <span className="t-overline-sm text-2">Avg on target</span>
            </div>
          </section>
        )}

        <div className="row-between section-title">
          <h2 className="t-h3">History</h2>
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

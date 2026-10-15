import { shotLabel } from '../domain/catalog.ts';
import type { SessionSummary } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Badge, Button } from '../ui/controls.tsx';
import { formatDate, formatDuration, plural } from '../ui/format.ts';
import { LargeTitleScreen } from '../ui/LargeTitleScreen.tsx';

function HistoryRow({ summary, onOpen }: { summary: SessionSummary; onOpen: () => void }) {
  return (
    <button type="button" className="card history-row" onClick={onOpen}>
      <span className="t-h5">{formatDate(summary.startedAt)}</span>
      <span className="t-body-sm text-2">
        {formatDuration(summary.durationSec)} · {plural(summary.totalShots, 'shot')}
      </span>
      {(summary.shotIds.length > 0 || summary.onTargetPct !== undefined) && (
        <span className="pill-row">
          {summary.shotIds.map((id) => (
            <Badge key={id}>{shotLabel(id)}</Badge>
          ))}
          {summary.onTargetPct !== undefined && (
            <Badge variant="brand">On target {summary.onTargetPct}%</Badge>
          )}
        </span>
      )}
    </button>
  );
}

export function TrainingScreen() {
  const { state, actions } = useTraining();

  return (
    <LargeTitleScreen title="Training">
      <Button full onClick={actions.startTraining}>
        Start Training
      </Button>
      <h2 className="t-h3 section-title">History</h2>
      {state.history.length === 0 ? (
        <p className="t-body text-2">Your finished sessions will show up here.</p>
      ) : (
        <div className="stack-8">
          {state.history.map((summary) => (
            <HistoryRow
              key={summary.id}
              summary={summary}
              onOpen={() => void actions.openHistory(summary.id)}
            />
          ))}
        </div>
      )}
    </LargeTitleScreen>
  );
}

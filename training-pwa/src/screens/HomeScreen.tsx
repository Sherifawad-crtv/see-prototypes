import { useTraining } from '../store/TrainingProvider.tsx';
import { Button } from '../ui/controls.tsx';
import { Gauge, Tile, ColorBlock } from '../ui/blocks.tsx';
import { Icon } from '../ui/icons.tsx';
import { formatDurationClock } from '../ui/format.ts';

const SESSION_GOAL = 10;

export function HomeScreen() {
  const { state, actions } = useTraining();
  const { history } = state;

  const sessions = history.length;
  const shots = history.reduce((sum, s) => sum + s.totalShots, 0);
  const seconds = history.reduce((sum, s) => sum + s.durationSec, 0);
  const targeted = history.filter((s) => s.onTargetPct !== undefined);
  const average = targeted.length
    ? Math.round(targeted.reduce((sum, s) => sum + (s.onTargetPct ?? 0), 0) / targeted.length)
    : null;
  const best = targeted.length ? Math.max(...targeted.map((s) => s.onTargetPct ?? 0)) : null;
  const types = new Set(history.flatMap((s) => s.shotIds)).size;

  return (
    <main className="screen has-nav">
      <div className="screen-body">
        <header className="home-head">
          <span className="brand-mark t-display-sm">
            S<span className="wordmark-dot" />
          </span>
          <span className="pill-info t-label-sm">
            <Icon name="history" size={20} />
            {sessions === 1 ? '1 session' : `${sessions} sessions`}
          </span>
        </header>

        <div className="greeting">
          <p className="t-h2 text-2">Hello</p>
          <h1 className="t-display-md">Ready to train?</h1>
        </div>

        <div className="gauges">
          <Gauge
            tone="blue"
            label="Sessions"
            value={Math.min(100, (sessions / SESSION_GOAL) * 100)}
            display={sessions}
          />
          <Gauge
            tone="orange"
            label="On target"
            value={average ?? 0}
            display={average === null ? '–' : `${average}%`}
          />
        </div>

        <div className="tiles">
          <Tile label="Shots tracked" value={shots} icon="sports_tennis" />
          <Tile label="Best on target" value={best === null ? '–' : `${best}%`} icon="military_tech" />
          <Tile label="Time trained (min:sec)" value={formatDurationClock(seconds)} icon="schedule" />
          <Tile label="Shot types" value={types} icon="star" />
        </div>

        <section className="start-card">
          <ColorBlock tone="blue" label="NEW SESSION" value="Train" unit="now" shape="court" wide />
          <Button full variant="accent" icon={<Icon name="play_arrow" size={26} />} onClick={actions.startTraining}>
            Start Training
          </Button>
        </section>
      </div>
    </main>
  );
}

import { useState } from 'react';
import { devTools } from './services/index.ts';
import { useTraining } from './store/TrainingProvider.tsx';

export function DevPanel() {
  const { actions } = useTraining();
  const [open, setOpen] = useState(false);
  const [interval, setIntervalMs] = useState(devTools.trackerConfig.intervalMs);
  const [sigma, setSigma] = useState(devTools.trackerConfig.targetedSigma);

  return (
    <div className="dev">
      {open && (
        <div className="dev-panel t-body-sm">
          <label className="stack-8">
            Interval (ms)
            <input
              type="number"
              min={100}
              step={100}
              value={interval}
              onChange={(event) => {
                const value = Number(event.target.value);
                setIntervalMs(value);
                if (value >= 100) devTools.trackerConfig.intervalMs = value;
              }}
            />
          </label>
          <label className="stack-8">
            Targeted accuracy (σ)
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={sigma}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSigma(value);
                if (value > 0) devTools.trackerConfig.targetedSigma = value;
              }}
            />
          </label>
          <button
            type="button"
            className="dev-toggle t-label-sm"
            onClick={() => void devTools.clearAllHistory().then(actions.refreshHistory)}
          >
            Clear all history
          </button>
        </div>
      )}
      <button type="button" className="dev-toggle t-label-sm" onClick={() => setOpen(!open)}>
        Dev
      </button>
    </div>
  );
}

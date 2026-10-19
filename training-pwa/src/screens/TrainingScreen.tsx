import { useEffect, useRef, useState } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import type { SessionSummary } from '../domain/types.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { Button, Chip } from '../ui/controls.tsx';
import { formatDuration, plural } from '../ui/format.ts';
import { Icon } from '../ui/icons.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';

const MAX_PILLS = 3;

function StartButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      full
      data-tour="start"
      variant="accent"
      className="btn-end-icon"
      icon={<Icon name="arrow_forward" size={22} />}
      onClick={onClick}
    >
      Start Training
    </Button>
  );
}

function HistoryRow({ summary, onOpen }: { summary: SessionSummary; onOpen: () => void }) {
  const date = new Date(summary.startedAt);
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const hidden = summary.shotIds.length - MAX_PILLS;
  return (
    <button type="button" className="history-row" onClick={onOpen}>
      <span className="date-block">
        <span className="date-month t-overline-sm">{month}</span>
        <span className="date-day t-stat-md">{date.getDate()}</span>
      </span>
      <span className="history-main">
        <span className="t-label-lg">
          {plural(summary.totalShots, 'shot')} · {formatDuration(summary.durationSec)}
        </span>
        <span className="t-body text-3">{time}</span>
        {(summary.shotIds.length > 0 || summary.onTargetPct !== undefined) && (
          <span className="pill-row">
            {summary.onTargetPct !== undefined && <Chip selected>On target {summary.onTargetPct}%</Chip>}
            {summary.shotIds.slice(0, MAX_PILLS).map((id) => (
              <Chip key={id}>{shotLabel(id)}</Chip>
            ))}
            {hidden > 0 && <Chip>+{hidden}</Chip>}
          </span>
        )}
      </span>
      <Icon name="chevron_right" size={28} />
    </button>
  );
}

export function TrainingScreen() {
  const { state, actions } = useTraining();
  const { history } = state;
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const empty = history.length === 0;

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry?.isIntersecting ?? true));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [empty]);

  return (
    <main className="screen">
      <PageHeader
        title="Training"
        trailing={
          <Button variant="secondary" className="btn-sm" onClick={() => actions.setTour(0)}>
            Tutorial
          </Button>
        }
      />
      <div className="screen-body">
        {empty ? (
          <div className="empty-state">
            <img className="empty-racket" src="/images/empty-racket.webp" alt="" />
            <h2 className="t-display-sm empty-title">No training sessions</h2>
            <p className="t-body-lg text-2">Start your first training session to see your performance here</p>
            <StartButton onClick={actions.startTraining} />
          </div>
        ) : (
          <>
            <section ref={heroRef} className="hero-banner">
              <img className="hero-image" src="/images/training-hero.webp" alt="" />
              <h2 className="t-stat-sm hero-title">Start your training session</h2>
              <StartButton onClick={actions.startTraining} />
            </section>

            <div className="row-between history-head">
              <h2 className="t-title-light">History</h2>
              <span className="t-label-lg text-link">{plural(history.length, 'session')}</span>
            </div>
            <div className="history-card">
              {history.map((summary) => (
                <HistoryRow
                  key={summary.id}
                  summary={summary}
                  onOpen={() => void actions.openHistory(summary.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {!empty && !heroVisible && (
        <footer className="float-bar float-bar-cta">
          <StartButton onClick={actions.startTraining} />
        </footer>
      )}
    </main>
  );
}

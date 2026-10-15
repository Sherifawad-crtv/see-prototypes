import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { amountText, useTraining } from '../store/TrainingProvider.tsx';
import { runningItem } from '../store/reducer.ts';
import { Badge, Button, ProgressBar } from '../ui/controls.tsx';
import { Court, type CourtDot } from '../ui/Court.tsx';
import { plural } from '../ui/format.ts';
import { Camera, Plus, Repeat, Stop } from '../ui/icons.tsx';

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock?.request('screen');
        if (!next) return;
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Wake lock is optional: it can be denied or unsupported.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, []);
}

export function LiveScreen() {
  const { state, actions } = useTraining();
  useWakeLock();
  const session = state.session;
  if (!session) return null;

  const running = runningItem(session);
  const current = running ?? session.cart.findLast((item) => item.status === 'done');
  const next = session.cart.find((item) => item.status === 'upcoming');
  const idle = !running;
  const targeted = current?.mode === 'targeted';

  const shots = current ? session.shots.filter((shot) => shot.cartItemId === current.id) : [];
  const dots: CourtDot[] = shots.map((shot, index) => ({
    id: shot.id,
    shotId: shot.shotId,
    x: shot.landing.x,
    y: shot.landing.y,
    inBounds: shot.inBounds,
    hit: shot.hit,
    latest: index === shots.length - 1,
  }));

  const total = current?.amount.kind === 'count' ? current.amount.n : null;
  const progressText =
    current && total !== null ? `${current.detected} / ${total}` : plural(current?.detected ?? 0, 'shot');
  const repeatText = current ? `Repeat ${shotLabel(current.shotId)} ${amountText(current.amount)}` : '';

  return (
    <main className="screen">
      <div className="screen-body">
        <div className="live-head">
          {idle ? (
            <Badge>Waiting for next drill</Badge>
          ) : (
            <Badge variant="success">
              <span className="live-pill">
                <span className="live-dot" /> Tracking live
              </span>
            </Badge>
          )}
        </div>

        <div className="card live-card">
          <div className="court-frame">
            <Court
              mode="live"
              view="half"
              dots={dots}
              targeted={targeted}
              zones={targeted && current?.targetZone ? [{ id: current.targetZone, emphasis: 'target' }] : []}
            />
          </div>
          <p className="caption-row t-body-sm">
            <Camera />
            {idle ? 'Repeat or add a drill to keep tracking' : 'Camera is tracking your shots'}
          </p>
        </div>

        {current && (
          <div className="card drilling">
            <div className="row-between">
              <div>
                <p className="t-overline text-2">{idle ? 'Cart complete' : 'Now drilling'}</p>
                <p className="t-display-sm">{shotLabel(current.shotId)}</p>
              </div>
              <p className="t-stat-sm" aria-live="polite">
                {progressText}
              </p>
            </div>
            {total !== null && (
              <ProgressBar label="Drill progress" value={(current.detected / total) * 100} />
            )}
          </div>
        )}

        {next && <p className="t-label-sm text-2">Up next: {shotLabel(next.shotId)}</p>}
      </div>

      <section className="dock" aria-label="Session controls">
        <div className="dock-pair">
          <Button variant="secondary" icon={<Repeat />} sublabel={repeatText} onClick={actions.redoLive}>
            Redo
          </Button>
          <Button
            variant="secondary"
            icon={<Plus />}
            sublabel="Open the shot cart"
            onClick={actions.trainAnother}
          >
            Train Another Shot
          </Button>
        </div>
        <Button
          full
          variant="accent"
          icon={<Stop />}
          sublabel="Your training results open next"
          onClick={actions.requestEnd}
        >
          End Session
        </Button>
      </section>
    </main>
  );
}

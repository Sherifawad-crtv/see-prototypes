import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { amountText, useTraining } from '../store/TrainingProvider.tsx';
import { runningItem } from '../store/reducer.ts';
import { Badge, Button, ProgressBar } from '../ui/controls.tsx';
import { Court, type CourtDot } from '../ui/Court.tsx';
import { Camera, Plus, Repeat, Stop } from '../ui/icons.tsx';

const MAX_TICKS = 20;

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

function Ticks({ total, done }: { total: number; done: number }) {
  return (
    <div
      className="ticks"
      role="progressbar"
      aria-label="Drill progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={`tick${index < done ? ' tick-on' : ''}`} />
      ))}
    </div>
  );
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
  const position = current ? session.cart.findIndex((item) => item.id === current.id) + 1 : 0;

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
  const repeatText = current ? `Repeat ${shotLabel(current.shotId)} ${amountText(current.amount)}` : '';

  return (
    <main className="screen screen-live">
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
          {current && (
            <span className="t-label-sm live-position">
              Drill {position} of {session.cart.length}
            </span>
          )}
        </div>

        <div className="court-stage court-stage-live">
          <Court
            mode="live"
            view="half"
            dots={dots}
            targeted={targeted}
            zones={targeted && current?.targetZone ? [{ id: current.targetZone, emphasis: 'target' }] : []}
          />
          <p className="court-caption t-caption">
            <Camera />
            {idle ? 'Repeat or add a drill to keep tracking' : 'Camera is tracking your shots'}
          </p>
        </div>

        {current && (
          <div className="drilling">
            <div className="row-between">
              <div className="stack-4">
                <p className="t-overline drilling-kicker">{idle ? 'Cart complete' : 'Now drilling'}</p>
                <p className="t-display-md">{shotLabel(current.shotId)}</p>
                {targeted && current.targetZone && (
                  <p className="t-label-sm drilling-kicker">Aiming for {getZone(current.targetZone).label}</p>
                )}
              </div>
              <p className="live-count t-stat-lg" aria-live="polite">
                {current.detected}
                <span className="live-count-of t-stat-sm">{total !== null ? ` / ${total}` : ' shots'}</span>
              </p>
            </div>
            {total !== null &&
              (total <= MAX_TICKS ? (
                <Ticks total={total} done={current.detected} />
              ) : (
                <ProgressBar tone="on-dark" label="Drill progress" value={(current.detected / total) * 100} />
              ))}
          </div>
        )}

        {next && <p className="up-next t-label-sm">Up next: {shotLabel(next.shotId)}</p>}
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

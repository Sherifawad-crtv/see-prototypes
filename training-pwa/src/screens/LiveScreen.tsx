import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { amountText, useTraining } from '../store/TrainingProvider.tsx';
import { runningItem } from '../store/reducer.ts';
import { Badge, Button, ProgressBar } from '../ui/controls.tsx';
import { Court, type CourtDot } from '../ui/Court.tsx';
import { Icon } from '../ui/icons.tsx';
import { Shape } from '../ui/shapes.tsx';

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
    <main className="screen">
      <div className="screen-body live-body">
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
            <span className="t-label-sm text-2">
              Drill {position} of {session.cart.length}
            </span>
          )}
        </div>

        {current && (
          <div className="block block-blue drilling">
            <Shape kind="court" />
            <p className="t-block-label block-label">{idle ? 'Cart complete' : 'Now drilling'}</p>
            <hr className="block-rule" />
            <div className="drilling-row">
              <div className="stack-4">
                <p className="t-display-md">{shotLabel(current.shotId)}</p>
                {targeted && current.targetZone && (
                  <p className="t-label-sm drilling-aim">Aiming for {getZone(current.targetZone).label}</p>
                )}
              </div>
              <p className="live-count t-display-lg" aria-live="polite">
                {current.detected}
                <span className="live-count-of t-label-lg">{total !== null ? ` / ${total}` : ' shots'}</span>
              </p>
            </div>
            {total !== null && (
              <ProgressBar tone="on-color" label="Drill progress" value={(current.detected / total) * 100} />
            )}
          </div>
        )}

        <div className="court-stage court-stage-live">
          <Court
            mode="live"
            view="half"
            dots={dots}
            zones={targeted && current?.targetZone ? [{ id: current.targetZone, emphasis: 'target' }] : []}
          />
          <p className="court-caption t-caption">
            <Icon name="videocam" size={18} />
            {idle ? 'Repeat or add a drill to keep tracking' : 'Camera is tracking your shots'}
          </p>
        </div>

        {next && <p className="up-next t-label-sm">Up next: {shotLabel(next.shotId)}</p>}
      </div>

      <section className="dock" aria-label="Session controls">
        <div className="dock-pair">
          <Button
            variant="secondary"
            icon={<Icon name="replay" size={26} />}
            sublabel={repeatText}
            onClick={actions.redoLive}
          >
            Redo
          </Button>
          <Button
            variant="secondary"
            icon={<Icon name="add" size={26} />}
            sublabel="Open the shot cart"
            onClick={actions.trainAnother}
          >
            Train Another Shot
          </Button>
        </div>
        <Button
          full
          variant="accent"
          icon={<Icon name="stop" size={26} />}
          sublabel="Your training results open next"
          onClick={actions.requestEnd}
        >
          End Session
        </Button>
      </section>
    </main>
  );
}

import { useEffect, useLayoutEffect, useState } from 'react';
import { useTraining } from '../store/TrainingProvider.tsx';
import type { Screen } from '../store/reducer.ts';
import { Icon } from './icons.tsx';

interface Step {
  screen: Screen;
  target: string;
  title: string;
  text: string;
  next: string;
}

const STEPS: Step[] = [
  {
    screen: 'training',
    target: 'start',
    title: 'Start a session',
    text: 'Tap here to begin. You build a list of shots, then train through them one by one.',
    next: 'Next',
  },
  {
    screen: 'add',
    target: 'modes',
    title: 'Free or Targeted',
    text: 'Free tracks wherever you hit. Targeted scores every shot as a hit or a miss against zones you set.',
    next: 'Next',
  },
  {
    screen: 'add',
    target: 'shots',
    title: 'Pick a shot',
    text: 'Choose a shot to add. Keep adding as many as you like before you view your list.',
    next: 'Next',
  },
  {
    screen: 'target',
    target: 'court',
    title: 'Place your cones',
    text: 'Tap the court to place a cone, tap a cone to remove it. From 3 cones they join into your target shape.',
    next: 'Next',
  },
  {
    screen: 'target',
    target: 'zones',
    title: 'Add more zones',
    text: 'Set up to 4 zones, for example one in the corner and one in the middle. Each gets its own shape.',
    next: 'Next',
  },
  {
    screen: 'target',
    target: 'continue',
    title: 'Set the amount',
    text: 'Continue to choose how many shots, add it to your list, then press Start when you are ready.',
    next: 'OK',
  },
];

const PAD = 8;
const CARD_GAP = 14;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function Tour() {
  const { state, actions } = useTraining();
  const step = state.tour;
  const top = state.stack.at(-1);
  const current = step === null ? null : STEPS[step];
  const [box, setBox] = useState<Box | null>(null);

  // Keep the demo moving: if the screen is not the one this step belongs to, wait for it.
  const onScreen = current !== null && top === current.screen;

  useLayoutEffect(() => {
    if (!current || !onScreen) {
      setBox(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
      if (!el) return setBox(null);
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      setBox({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    measure();
    const id = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', measure);
    };
  }, [current, onScreen]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') actions.exitTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, actions]);

  if (step === null || !current || !box) return null;

  const next = () => {
    const done = step === STEPS.length - 1;
    if (done) return actions.exitTour();
    // Moving on may need the app to open the next screen first.
    if (step === 0) actions.startTraining();
    if (step === 2) {
      actions.setMode('targeted');
      actions.pickShot('serve', 'targeted');
    }
    actions.setTour(step + 1);
  };

  const left = Math.max(6, box.x - PAD);
  const right = Math.min(window.innerWidth - 6, box.x + box.w + PAD);
  const hole = { x: left, y: box.y - PAD, w: right - left, h: box.h + PAD * 2 };
  const below = hole.y + hole.h + CARD_GAP + 190 < window.innerHeight;
  const cardTop = below ? hole.y + hole.h + CARD_GAP : Math.max(16, hole.y - CARD_GAP - 190);

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Tutorial">
      <svg className="tour-dim" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={20} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" className="tour-fill" mask="url(#tour-mask)" />
        <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={20} className="tour-ring" />
      </svg>
      <div className="tour-card" style={{ top: cardTop }}>
        <h2 className="t-h4">{current.title}</h2>
        <p className="t-body text-2">{current.text}</p>
        <div className="row-between">
          <span className="t-caption-b text-3">
            {step + 1}/{STEPS.length}
          </span>
          <button type="button" className="btn btn-primary btn-sm tour-next" onClick={next}>
            <span className="btn-label t-label">{current.next}</span>
          </button>
        </div>
      </div>
      <button type="button" className="tour-close" aria-label="Close tutorial" onClick={actions.exitTour}>
        <Icon name="close" size={24} />
      </button>
    </div>
  );
}

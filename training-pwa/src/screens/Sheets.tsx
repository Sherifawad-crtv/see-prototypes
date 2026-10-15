import type { ReactNode } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { DEFAULT_COUNT, MAX_DRILLS } from '../store/reducer.ts';
import { AmountControl } from '../ui/AmountControl.tsx';
import { Button, Chip } from '../ui/controls.tsx';
import { Plus, Play, Stop, Trash } from '../ui/icons.tsx';
import { Sheet } from '../ui/Sheet.tsx';
import { ZoneThumb } from '../ui/ZoneThumb.tsx';

function AmountSheet() {
  const { state, actions } = useTraining();
  const { draft, session, lastCounts } = state;
  if (!draft.shotId) return null;
  const full = (session?.cart.length ?? 0) >= MAX_DRILLS;

  return (
    <Sheet title="Choose how many shots" onClose={actions.closeSheet}>
      <div className="sheet-head">
        <div className="stack-4">
          <p className="t-overline text-2">{draft.mode === 'free' ? 'Free drill' : 'Targeted drill'}</p>
          <h2 className="t-display-md">{shotLabel(draft.shotId)}</h2>
        </div>
        {draft.mode === 'targeted' && draft.targetZone && (
          <div className="sheet-target">
            <ZoneThumb zone={draft.targetZone} />
            <div className="stack-4">
              <p className="t-overline-sm text-2">Aiming for</p>
              <Chip accent>{getZone(draft.targetZone).label}</Chip>
            </div>
            <Button variant="ghost" className="btn-sm" onClick={actions.changeTarget}>
              Change
            </Button>
          </div>
        )}
      </div>
      <AmountControl
        large
        amount={draft.amount}
        lastCount={lastCounts.draft ?? DEFAULT_COUNT}
        onChange={actions.setDraftAmount}
      />
      <Button full disabled={full} icon={<Plus />} onClick={actions.addToCart}>
        Add to cart
      </Button>
    </Sheet>
  );
}

function SheetIcon({ tone, children }: { tone: 'accent' | 'brand' | 'danger'; children: ReactNode }) {
  return <span className={`sheet-icon sheet-icon-${tone}`}>{children}</span>;
}

function EndConfirmSheet() {
  const { actions } = useTraining();
  return (
    <Sheet title="End session?" onClose={actions.closeSheet}>
      <div className="stack-8">
        <SheetIcon tone="accent">
          <Stop />
        </SheetIcon>
        <h2 className="t-display-sm">End session?</h2>
        <p className="t-body text-2">Upcoming drills will be skipped. Shots so far are saved.</p>
      </div>
      <div className="sheet-actions">
        <Button full onClick={actions.endSession}>
          End and see results
        </Button>
        <Button full variant="ghost" onClick={actions.closeSheet}>
          Keep training
        </Button>
      </div>
    </Sheet>
  );
}

function DiscardSheet() {
  const { actions } = useTraining();
  return (
    <Sheet title="Discard this cart?" onClose={actions.closeSheet}>
      <div className="stack-8">
        <SheetIcon tone="danger">
          <Trash />
        </SheetIcon>
        <h2 className="t-display-sm">Discard this cart?</h2>
        <p className="t-body text-2">The drills you added will be removed.</p>
      </div>
      <div className="sheet-actions">
        <Button full onClick={actions.discardCart}>
          Discard
        </Button>
        <Button full variant="ghost" onClick={actions.closeSheet}>
          Keep editing
        </Button>
      </div>
    </Sheet>
  );
}

function ResumeSheet() {
  const { actions } = useTraining();
  return (
    <Sheet title="Unfinished session">
      <div className="stack-8">
        <SheetIcon tone="brand">
          <Play />
        </SheetIcon>
        <h2 className="t-display-sm">Pick up where you left off?</h2>
        <p className="t-body text-2">You have a training session that was not finished.</p>
      </div>
      <div className="sheet-actions">
        <Button full onClick={actions.resumeSession}>
          Resume session
        </Button>
        <Button full variant="secondary" onClick={actions.endResumed}>
          End and see results
        </Button>
      </div>
    </Sheet>
  );
}

export function Sheets() {
  const { state } = useTraining();
  switch (state.sheet) {
    case 'amount':
      return <AmountSheet />;
    case 'endConfirm':
      return <EndConfirmSheet />;
    case 'discard':
      return <DiscardSheet />;
    case 'resume':
      return <ResumeSheet />;
    default:
      return null;
  }
}

import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { DEFAULT_COUNT, MAX_DRILLS } from '../store/reducer.ts';
import { AmountControl } from '../ui/AmountControl.tsx';
import { OptionCard } from '../ui/blocks.tsx';
import { Button, Chip, IconButton } from '../ui/controls.tsx';
import { Icon } from '../ui/icons.tsx';
import { Sheet } from '../ui/Sheet.tsx';
import { ZoneThumb } from '../ui/ZoneThumb.tsx';

const SAVED_MS = 1800;

function SheetTitle({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <div className="sheet-title">
      <h2 className="t-h2">{title}</h2>
      {onClose && (
        <IconButton variant="secondary" label="Close" onClick={onClose}>
          <Icon name="close" size={24} />
        </IconButton>
      )}
    </div>
  );
}

function AmountSheet() {
  const { state, actions } = useTraining();
  const { draft, session, lastCounts } = state;
  if (!draft.shotId) return null;
  const full = (session?.cart.length ?? 0) >= MAX_DRILLS;

  return (
    <Sheet title="Choose how many shots" onClose={actions.closeSheet}>
      <div className="sheet-title">
        <div className="stack-4">
          <p className="t-overline text-2">{draft.mode === 'free' ? 'Free drill' : 'Targeted drill'}</p>
          <h2 className="t-display-md">{shotLabel(draft.shotId)}</h2>
        </div>
        <IconButton variant="secondary" label="Close" onClick={actions.closeSheet}>
          <Icon name="close" size={24} />
        </IconButton>
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
      <AmountControl
        large
        amount={draft.amount}
        lastCount={lastCounts.draft ?? DEFAULT_COUNT}
        onChange={actions.setDraftAmount}
      />
      <Button full disabled={full} icon={<Icon name="add" size={26} />} onClick={actions.addToCart}>
        Add to cart
      </Button>
    </Sheet>
  );
}

function EndConfirmSheet() {
  const { actions } = useTraining();
  return (
    <Sheet title="End session?" onClose={actions.closeSheet}>
      <SheetTitle title="End session?" onClose={actions.closeSheet} />
      <div className="stack-12">
        <OptionCard
          icon="stop"
          title="End and see results"
          subtitle="Upcoming drills will be skipped. Shots so far are saved."
          action="check"
          tone="orange"
          onClick={actions.endSession}
        />
        <OptionCard
          icon="play_arrow"
          title="Keep training"
          subtitle="Go back to your drill"
          action="arrow_forward"
          onClick={actions.closeSheet}
        />
      </div>
    </Sheet>
  );
}

function DiscardSheet() {
  const { actions } = useTraining();
  return (
    <Sheet title="Discard this cart?" onClose={actions.closeSheet}>
      <SheetTitle title="Discard this cart?" onClose={actions.closeSheet} />
      <div className="stack-12">
        <OptionCard
          icon="delete"
          title="Discard"
          subtitle="The drills you added will be removed."
          action="check"
          tone="orange"
          onClick={actions.discardCart}
        />
        <OptionCard
          icon="sports_tennis"
          title="Keep editing"
          subtitle="Back to your shot cart"
          action="arrow_forward"
          onClick={actions.closeSheet}
        />
      </div>
    </Sheet>
  );
}

function ResumeSheet() {
  const { actions } = useTraining();
  return (
    <Sheet title="Unfinished session">
      <SheetTitle title="Pick up where you left off?" />
      <div className="stack-12">
        <OptionCard
          icon="play_arrow"
          title="Resume session"
          subtitle="Continue your unfinished training"
          action="arrow_forward"
          onClick={actions.resumeSession}
        />
        <OptionCard
          icon="stop"
          title="End and see results"
          subtitle="Save the shots so far"
          action="check"
          tone="orange"
          onClick={actions.endResumed}
        />
      </div>
    </Sheet>
  );
}

function SavedSheet() {
  const { actions } = useTraining();
  useEffect(() => {
    const timer = setTimeout(actions.closeSheet, SAVED_MS);
    return () => clearTimeout(timer);
  }, [actions]);

  return (
    <Sheet title="Session saved" onClose={actions.closeSheet}>
      <div className="saved">
        <span className="saved-art">
          <Icon name="analytics" size={76} className="saved-icon" />
        </span>
        <h2 className="t-display-md saved-title">SESSION SAVED!</h2>
        <p className="t-body-lg text-2">Your results are ready</p>
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
    case 'saved':
      return <SavedSheet />;
    default:
      return null;
  }
}

import { useEffect } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { getZone } from '../domain/zones.ts';
import { useTraining } from '../store/TrainingProvider.tsx';
import { DEFAULT_COUNT, MAX_DRILLS } from '../store/reducer.ts';
import { AmountControl } from '../ui/AmountControl.tsx';
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
        Add
      </Button>
    </Sheet>
  );
}

interface ConfirmProps {
  title: string;
  text: string;
  secondary: { label: string; onClick: () => void };
  primary: { label: string; onClick: () => void };
  onClose?: () => void;
}

function ConfirmSheet({ title, text, secondary, primary, onClose }: ConfirmProps) {
  return (
    <Sheet title={title} onClose={onClose}>
      <SheetTitle title={title} onClose={onClose} />
      <p className="t-body text-2 confirm-text">{text}</p>
      <div className="confirm-actions">
        <Button variant="secondary" onClick={secondary.onClick}>
          {secondary.label}
        </Button>
        <Button onClick={primary.onClick}>{primary.label}</Button>
      </div>
    </Sheet>
  );
}

function EndConfirmSheet() {
  const { actions } = useTraining();
  return (
    <ConfirmSheet
      title="End session?"
      text="Upcoming drills will be skipped. Shots so far are saved."
      secondary={{ label: 'Keep training', onClick: actions.closeSheet }}
      primary={{ label: 'End and see results', onClick: actions.endSession }}
      onClose={actions.closeSheet}
    />
  );
}

function DiscardSheet() {
  const { actions } = useTraining();
  return (
    <ConfirmSheet
      title="Discard this list?"
      text="The drills you added will be removed."
      secondary={{ label: 'Keep editing', onClick: actions.closeSheet }}
      primary={{ label: 'Discard', onClick: actions.discardCart }}
      onClose={actions.closeSheet}
    />
  );
}

function ResumeSheet() {
  const { actions } = useTraining();
  return (
    <ConfirmSheet
      title="Pick up where you left off?"
      text="You have a training session that was not finished."
      secondary={{ label: 'End and see results', onClick: actions.endResumed }}
      primary={{ label: 'Resume session', onClick: actions.resumeSession }}
    />
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

import { DevPanel } from './DevPanel.tsx';
import { AddShotScreen } from './screens/AddShotScreen.tsx';
import { CartScreen } from './screens/CartScreen.tsx';
import { ResultsScreen } from './screens/ResultsScreen.tsx';
import { Sheets } from './screens/Sheets.tsx';
import { TargetScreen } from './screens/TargetScreen.tsx';
import { TrainingScreen } from './screens/TrainingScreen.tsx';
import { useTraining } from './store/TrainingProvider.tsx';
import type { Screen } from './store/reducer.ts';
import { Tooltip } from './ui/controls.tsx';
import { IconGradients } from './ui/icons.tsx';

const SCREENS: Record<Screen, () => React.JSX.Element | null> = {
  training: TrainingScreen,
  cart: CartScreen,
  add: AddShotScreen,
  target: TargetScreen,
  results: ResultsScreen,
};

const DEV = new URLSearchParams(window.location.search).get('dev') === '1';

export function App() {
  const { state } = useTraining();
  const top = state.stack.at(-1) ?? 'training';
  const Current = SCREENS[top];

  return (
    <div className="app">
      <IconGradients />
      {state.ready && <Current key={top} />}
      <Sheets />
      <div className="toast-host" aria-live="polite">
        {state.toast && <Tooltip key={state.toast.id}>{state.toast.text}</Tooltip>}
      </div>
      {DEV && <DevPanel />}
    </div>
  );
}

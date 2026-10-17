import { Icon } from './icons.tsx';

interface NavProps {
  onTraining: () => void;
  onQuickStart: () => void;
}

export function Nav({ onTraining, onQuickStart }: NavProps) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-pill">
        <button type="button" aria-label="Home" aria-current="page" className="nav-item nav-item-on">
          <Icon name="home" size={30} />
          <span className="t-caption-sm nav-label">Home</span>
        </button>
        <button type="button" aria-label="Training" className="nav-item" onClick={onTraining}>
          <Icon name="sports_tennis" size={30} />
          <span className="t-caption-sm nav-label">Training</span>
        </button>
      </div>
      <button type="button" aria-label="Quick start" className="nav-action" onClick={onQuickStart}>
        <Icon name="play_arrow" size={34} />
      </button>
    </nav>
  );
}

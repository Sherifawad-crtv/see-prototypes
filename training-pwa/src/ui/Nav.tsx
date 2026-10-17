import { Icon, type IconName } from './icons.tsx';

export type Tab = 'home' | 'training';

const ITEMS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'home', label: 'Home', icon: 'home' },
  { tab: 'training', label: 'Training', icon: 'sports_tennis' },
];

interface NavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onQuickStart: () => void;
}

export function Nav({ active, onChange, onQuickStart }: NavProps) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-pill">
        {ITEMS.map((item) => (
          <button
            key={item.tab}
            type="button"
            aria-label={item.label}
            aria-current={item.tab === active ? 'page' : undefined}
            className={`nav-item${item.tab === active ? ' nav-item-on' : ''}`}
            onClick={() => onChange(item.tab)}
          >
            <Icon name={item.icon} size={30} />
            <span className="t-caption-sm nav-label">{item.label}</span>
          </button>
        ))}
      </div>
      <button type="button" aria-label="Quick start" className="nav-action" onClick={onQuickStart}>
        <Icon name="play_arrow" size={34} />
      </button>
    </nav>
  );
}

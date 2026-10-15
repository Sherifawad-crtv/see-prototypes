import type { ReactNode } from 'react';
import { IconButton } from './controls.tsx';
import { ChevronLeft } from './icons.tsx';

interface NavBarProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  trailing?: ReactNode;
  steps?: { current: number; labels: string[] };
}

export function NavBar({ title, subtitle, onBack, trailing, steps }: NavBarProps) {
  return (
    <header className="navbar">
      <div className="navbar-row">
        <IconButton variant="secondary" label="Back" onClick={onBack}>
          <ChevronLeft />
        </IconButton>
        <div className="navbar-title">
          <h1 className="t-display-sm">{title}</h1>
          {subtitle && <p className="t-body-sm text-2">{subtitle}</p>}
        </div>
        {trailing && <div className="navbar-trailing">{trailing}</div>}
      </div>
      {steps && (
        <ol className="steps" aria-label="Progress">
          {steps.labels.map((label, index) => (
            <li
              key={label}
              className={`step t-overline-sm${index < steps.current ? ' step-done' : ''}${index === steps.current ? ' step-now' : ''}`}
              aria-current={index === steps.current ? 'step' : undefined}
            >
              <span className="step-bar" />
              {label}
            </li>
          ))}
        </ol>
      )}
    </header>
  );
}

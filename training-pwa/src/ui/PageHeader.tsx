import type { ReactNode } from 'react';
import { IconButton } from './controls.tsx';
import { Icon } from './icons.tsx';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  steps?: { current: number; labels: string[] };
}

export function PageHeader({ title, subtitle, onBack, trailing, steps }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        {onBack && (
          <IconButton variant="secondary" label="Back" onClick={onBack}>
            <Icon name="chevron_left" size={28} />
          </IconButton>
        )}
        <div className="page-header-title">
          <h1 className="t-h3">{title}</h1>
          {subtitle && <p className="t-body-sm text-2">{subtitle}</p>}
        </div>
        {trailing}
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

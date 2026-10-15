import type { ReactNode } from 'react';
import { IconButton } from './controls.tsx';
import { ChevronLeft } from './icons.tsx';

interface NavBarProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  trailing?: ReactNode;
}

export function NavBar({ title, subtitle, onBack, trailing }: NavBarProps) {
  return (
    <header className="navbar">
      <div className="navbar-side">
        <IconButton variant="ghost" label="Back" onClick={onBack}>
          <ChevronLeft />
        </IconButton>
      </div>
      <div className="navbar-title">
        <h1 className="t-h4">{title}</h1>
        {subtitle && <p className="t-body-sm text-2">{subtitle}</p>}
      </div>
      <div className="navbar-side navbar-side-end">{trailing}</div>
    </header>
  );
}

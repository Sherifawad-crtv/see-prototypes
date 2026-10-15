import { useEffect, useState, type ReactNode } from 'react';
import { IconButton } from './controls.tsx';
import { ChevronLeft } from './icons.tsx';

interface LargeTitleScreenProps {
  title: string;
  onBack?: () => void;
  children: ReactNode;
}

export function LargeTitleScreen({ title, onBack, children }: LargeTitleScreenProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className="screen">
      <div className={`topbar${scrolled ? ' topbar-scrolled' : ''}`}>
        {onBack ? (
          <IconButton variant="ghost" label="Back" onClick={onBack}>
            <ChevronLeft />
          </IconButton>
        ) : (
          <span />
        )}
        <span className="topbar-title t-h4" aria-hidden="true">
          {title}
        </span>
        <span />
      </div>
      <h1 className="large-title t-display-md">{title}</h1>
      <div className="screen-body">{children}</div>
    </main>
  );
}

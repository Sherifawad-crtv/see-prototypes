import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-root">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grabber" />
        {children}
      </div>
    </div>
  );
}

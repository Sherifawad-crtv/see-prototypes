import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  full?: boolean;
  sublabel?: string;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  full = false,
  sublabel,
  icon,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${full ? ' btn-full' : ''}${sublabel ? ' btn-stacked' : ''} ${className}`}
      {...rest}
    >
      {icon}
      <span className="btn-text">
        <span className="btn-label t-h4">{children}</span>
        {sublabel && <span className="btn-sub t-caption">{sublabel}</span>}
      </span>
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  label: string;
}

export function IconButton({
  variant = 'secondary',
  label,
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`icon-btn icon-btn-${variant} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface TabsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

export function Tabs<T extends string>({ value, options, onChange, label }: TabsProps<T>) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={`tab t-label-lg${option.value === value ? ' tab-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ChipProps {
  selected?: boolean;
  accent?: boolean;
  onClick?: () => void;
  children: ReactNode;
  pressed?: boolean;
}

export function Chip({
  selected = false,
  accent = false,
  onClick,
  children,
  pressed,
}: ChipProps) {
  const variant = accent ? 'chip-accent' : selected ? 'chip-selected' : '';
  const content = <span className="chip-inner">{children}</span>;
  return onClick ? (
    <button
      type="button"
      className={`chip t-label ${variant}`}
      aria-pressed={pressed ?? selected}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <span className={`chip t-label ${variant}`}>{content}</span>
  );
}

type BadgeVariant = 'default' | 'brand' | 'accent' | 'success' | 'info';

export function Badge({
  variant = 'default',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return <span className={`badge badge-${variant} t-label-sm`}>{children}</span>;
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle${checked ? ' toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track">
        <span className="toggle-knob" />
      </span>
    </button>
  );
}

export function ProgressBar({
  value,
  label,
  tone = 'default',
}: {
  value: number;
  label: string;
  tone?: 'default' | 'on-color';
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`progress progress-${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Tooltip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`tooltip t-label-sm ${className}`} role="status">
      {children}
    </div>
  );
}


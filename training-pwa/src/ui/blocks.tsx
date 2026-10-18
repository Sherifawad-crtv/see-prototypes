import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons.tsx';
import { Shape, type ShapeKind } from './shapes.tsx';

interface GaugeProps {
  value: number;
  tone: 'blue' | 'orange';
  label: string;
  display: ReactNode;
}

const GAUGE_R = 54;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

export function Gauge({ value, tone, label, display }: GaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`gauge gauge-${tone}`} role="img" aria-label={`${label}: ${clamped}%`}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r={GAUGE_R} className="gauge-track" />
        <circle
          cx="60"
          cy="60"
          r={GAUGE_R}
          className="gauge-fill"
          strokeDasharray={GAUGE_C}
          strokeDashoffset={GAUGE_C * (1 - clamped / 100)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="gauge-core">
        <span className="t-stat-lg">{display}</span>
        <span className="t-label-sm text-2">{label}</span>
      </div>
    </div>
  );
}

interface TileProps {
  label: string;
  value: ReactNode;
  icon?: IconName;
}

export function Tile({ label, value, icon }: TileProps) {
  return (
    <div className="tile">
      <span className="t-body-sm tile-label">{label}</span>
      <span className="t-stat-md">{value}</span>
      {icon && <Icon name={icon} size={92} className="tile-icon" />}
    </div>
  );
}

interface ColorBlockProps {
  tone: 'blue' | 'orange';
  label: string;
  value: ReactNode;
  unit?: string;
  shape?: ShapeKind;
  icon?: IconName;
  wide?: boolean;
}

export function ColorBlock({ tone, label, value, unit, shape, icon, wide = false }: ColorBlockProps) {
  const long = String(value).length > 4;
  const valueClass = wide ? 't-block-value-lg' : long ? 't-block-value-sm' : 't-block-value';
  return (
    <div className={`block block-${tone}${wide ? ' block-wide' : ''}`}>
      {shape && <Shape kind={shape} />}
      {icon && <Icon name={icon} size={190} className="block-icon" />}
      <p className="t-block-label block-label">{label}</p>
      <hr className="block-rule" />
      <p className="block-value">
        <span className={valueClass}>{value}</span>
        {unit && <span className="t-block-label block-unit">{unit}</span>}
      </p>
    </div>
  );
}

interface PanelProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
}

export function Panel({ icon, title, subtitle, trailing, children }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel-head">
        <span className="panel-icon">
          <Icon name={icon} size={22} />
        </span>
        <div className="panel-title">
          <h2 className="t-h4">{title}</h2>
          {subtitle && <p className="t-body-sm text-3">{subtitle}</p>}
        </div>
        {trailing}
      </header>
      {children}
    </section>
  );
}

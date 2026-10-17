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

interface DonutProps {
  a: number;
  b: number;
  aLabel: string;
  bLabel: string;
}

const DONUT_R = 44;
const DONUT_C = 2 * Math.PI * DONUT_R;

export function Donut({ a, b, aLabel, bLabel }: DonutProps) {
  const total = a + b;
  const share = total === 0 ? 0 : a / total;
  const pctA = Math.round(share * 100);
  return (
    <div className="donut" role="img" aria-label={`${aLabel} ${pctA}%, ${bLabel} ${100 - pctA}%`}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r={DONUT_R} className="donut-b" />
        <circle
          cx="60"
          cy="60"
          r={DONUT_R}
          className="donut-a"
          strokeDasharray={`${DONUT_C * share} ${DONUT_C}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="donut-core">
        <span className="t-overline-sm donut-a-text">{aLabel}</span>
        <span className="t-stat-sm">{pctA}%</span>
        <span className="t-overline-sm donut-b-text">{bLabel}</span>
      </div>
    </div>
  );
}

interface TileProps {
  label: string;
  value: ReactNode;
  icon: IconName;
}

export function Tile({ label, value, icon }: TileProps) {
  return (
    <div className="tile">
      <span className="t-body-sm tile-label">{label}</span>
      <span className="t-stat-md">{value}</span>
      <Icon name={icon} size={92} className="tile-icon" />
    </div>
  );
}

interface ColorBlockProps {
  tone: 'blue' | 'orange';
  label: string;
  value: ReactNode;
  unit?: string;
  pct?: string;
  shape: ShapeKind;
  wide?: boolean;
}

export function ColorBlock({ tone, label, value, unit, pct, shape, wide = false }: ColorBlockProps) {
  return (
    <div className={`block block-${tone}${wide ? ' block-wide' : ''}`}>
      <Shape kind={shape} />
      <p className="t-block-label block-label">{label}</p>
      <hr className="block-rule" />
      <p className="block-value">
        <span className="t-display-lg">{value}</span>
        {unit && <span className="t-label-lg block-unit">{unit}</span>}
      </p>
      {pct && <span className="block-pct t-stat-sm">{pct}</span>}
    </div>
  );
}

interface OptionCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  action: IconName;
  onClick: () => void;
  tone?: 'blue' | 'orange';
}

export function OptionCard({ icon, title, subtitle, action, onClick, tone = 'blue' }: OptionCardProps) {
  return (
    <button type="button" className="option" onClick={onClick}>
      <span className={`option-icon option-icon-${tone}`}>
        <Icon name={icon} size={30} />
      </span>
      <span className="option-text">
        <span className="t-h4">{title}</span>
        <span className="t-body text-sub">{subtitle}</span>
      </span>
      <span className={`option-action option-action-${tone}`}>
        <Icon name={action} size={22} />
      </span>
    </button>
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

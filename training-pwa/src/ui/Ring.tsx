interface RingProps {
  value: number;
  label: string;
  caption?: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Ring({ value, label, caption }: RingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="ring" role="img" aria-label={`${label} ${clamped}%`}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r={RADIUS} className="ring-track" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          className="ring-fill"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-text">
        <span className="t-stat-sm">{clamped}%</span>
        {caption && <span className="t-overline-sm">{caption}</span>}
      </div>
    </div>
  );
}

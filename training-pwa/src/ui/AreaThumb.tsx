import { circlesOf } from '../domain/court.ts';
import type { Zone } from '../domain/types.ts';

export function AreaThumb({ zones }: { zones: Zone[] }) {
  return (
    <svg className="zone-thumb" viewBox="-3 -3 106 106" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="100" height="100" rx="8" className="thumb-court" />
      {circlesOf(zones).map((c, index) => (
        <circle key={index} cx={c.x * 100} cy={100 - c.y * 100} r={c.r * 100} className="thumb-zone" />
      ))}
      {zones.flat().map((cone, index) => (
        <circle key={index} cx={cone.x * 100} cy={100 - cone.y * 100} r="4" className="thumb-cone" />
      ))}
      <path d="M50 30.5V100M0 30.5H100" className="thumb-line" />
      <path d="M0 100H100" className="thumb-net" />
    </svg>
  );
}

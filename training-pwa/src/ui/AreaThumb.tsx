import type { Area, Cone } from '../domain/types.ts';

export function AreaThumb({ area, cones = [] }: { area: Area; cones?: Cone[] }) {
  return (
    <svg className="zone-thumb" viewBox="-3 -3 106 106" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="100" height="100" rx="8" className="thumb-court" />
      <rect
        x={area.x0 * 100}
        y={100 - area.y1 * 100}
        width={(area.x1 - area.x0) * 100}
        height={(area.y1 - area.y0) * 100}
        className="thumb-zone"
      />
      {cones.map((cone, index) => (
        <circle key={index} cx={cone.x * 100} cy={100 - cone.y * 100} r="5" className="thumb-cone" />
      ))}
      <path d="M50 30.5V100M0 30.5H100" className="thumb-line" />
      <path d="M0 100H100" className="thumb-net" />
    </svg>
  );
}

import type { ZoneId } from '../domain/types.ts';
import { getZone } from '../domain/zones.ts';

export function ZoneThumb({ zone }: { zone: ZoneId }) {
  const z = getZone(zone);
  return (
    <svg className="zone-thumb" viewBox="-3 -3 106 106" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="100" height="100" rx="8" className="thumb-court" />
      <rect
        x={z.x0 * 100}
        y={100 - z.y1 * 100}
        width={(z.x1 - z.x0) * 100}
        height={(z.y1 - z.y0) * 100}
        className="thumb-zone"
      />
      <path d="M50 30.5V100M0 30.5H100" className="thumb-line" />
      <path d="M0 100H100" className="thumb-net" />
    </svg>
  );
}

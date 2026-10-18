import { useRef, useState, type PointerEvent } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { clamp01, polygonOf, isComplete, MAX_CONES_PER_ZONE } from '../domain/court.ts';
import type { Zone } from '../domain/types.ts';
import { Tooltip } from './controls.tsx';

export interface CourtDot {
  id: string;
  shotId: string;
  x: number;
  y: number;
  inBounds: boolean;
  hit?: boolean;
}

interface CourtProps {
  mode: 'select' | 'results';
  view: 'half' | 'full';
  dots?: CourtDot[];
  zones?: Zone[];
  /** Select mode: the zone new cones go into. */
  activeZone?: number;
  onZonesChange?: (zones: Zone[]) => void;
}

type Point = { x: number; y: number };

const PAD = 2;
const COURT_W = 100;
const COURT_H = 200;
const NET_Y = 100;
const BAND = 30.5;
const DOT_R = 1.55;
const DOT_HIT_R = 4.5;

function viewBoxOf(view: 'half' | 'full') {
  const height = view === 'full' ? COURT_H : NET_Y;
  return { x: -PAD, y: -PAD, w: COURT_W + PAD * 2, h: height + PAD * 2 };
}

function dotPosition(dot: CourtDot) {
  return { x: clamp01(dot.x) * COURT_W, y: NET_Y - clamp01(dot.y) * NET_Y };
}

function dotState(dot: CourtDot): 'out' | 'hit' | 'miss' | 'free' {
  if (!dot.inBounds) return 'out';
  if (dot.hit === undefined) return 'free';
  return dot.hit ? 'hit' : 'miss';
}

export function Court({
  mode,
  view,
  dots = [],
  zones = [],
  activeZone = 0,
  onZonesChange,
}: CourtProps) {
  const box = viewBoxOf(view);
  const svgRef = useRef<SVGSVGElement>(null);
  const press = useRef<{ zone: number; cone: number } | { at: Point } | null>(null);
  const [activeDot, setActiveDot] = useState<string | null>(null);
  const active = dots.find((dot) => dot.id === activeDot);
  const pct = (value: number, origin: number, size: number) => ((value - origin) / size) * 100;
  const selecting = mode === 'select';

  const toCourt = (event: PointerEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * box.w + box.x;
    const svgY = ((event.clientY - rect.top) / rect.height) * box.h + box.y;
    return { x: clamp01(svgX / COURT_W), y: clamp01((NET_Y - svgY) / NET_Y) };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!selecting) return;
    const hit = (event.target as Element).closest('[data-cone]')?.getAttribute('data-cone');
    if (hit) {
      const [zone, cone] = hit.split('-').map(Number);
      press.current = { zone, cone };
    } else press.current = { at: toCourt(event) };
  };

  const onPointerUp = () => {
    const current = press.current;
    press.current = null;
    if (!current || !onZonesChange) return;
    if ('cone' in current) {
      onZonesChange(zones.map((zone, zi) => (zi === current.zone ? zone.filter((_, ci) => ci !== current.cone) : zone)));
      return;
    }
    const target = zones[activeZone];
    if (!target || target.length >= MAX_CONES_PER_ZONE) return;
    onZonesChange(zones.map((zone, zi) => (zi === activeZone ? [...zone, current.at] : zone)));
  };

  const tooltipText = (dot: CourtDot) => {
    if (dot.hit === undefined) return shotLabel(dot.shotId);
    const state = dotState(dot);
    const result = state === 'hit' ? 'Hit' : state === 'miss' ? 'Miss' : 'Out';
    return `${shotLabel(dot.shotId)} · ${result}`;
  };

  const shapes = zones.map((zone) => (zone.length >= 2 ? polygonOf(zone) : null));

  return (
    <div className="court">
      <svg
        ref={svgRef}
        className={`court-svg${selecting ? ' court-draw' : ''}`}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="img"
        aria-label={selecting ? 'Padel court. Tap to place a cone, tap a cone to remove it' : 'Padel court, opponent half at the top'}
        onClick={() => setActiveDot(null)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          press.current = null;
        }}
      >
        <rect x={0} y={0} width={COURT_W} height={view === 'full' ? COURT_H : NET_Y} className="court-fill" />
        <rect
          x={0}
          y={0}
          width={COURT_W}
          height={view === 'full' ? COURT_H : NET_Y}
          className="court-line"
          fill="none"
        />
        <rect x={0} y={0} width={COURT_W} height={BAND} className="court-shade" />
        {view === 'full' && (
          <rect x={0} y={COURT_H - BAND} width={COURT_W} height={BAND} className="court-shade" />
        )}
        <line x1={0} x2={COURT_W} y1={BAND} y2={BAND} className="court-line" />
        <line x1={50} x2={50} y1={BAND} y2={view === 'full' ? COURT_H - BAND : NET_Y} className="court-line" />
        {view === 'full' && (
          <line x1={0} x2={COURT_W} y1={COURT_H - BAND} y2={COURT_H - BAND} className="court-line" />
        )}
        <line x1={0} x2={COURT_W} y1={NET_Y + 1.6} y2={NET_Y + 1.6} className="court-net-shadow" />
        <line x1={0} x2={COURT_W} y1={NET_Y} y2={NET_Y} className="court-net" />
        <circle cx={0} cy={NET_Y} r={1.6} className="court-post" />
        <circle cx={COURT_W} cy={NET_Y} r={1.6} className="court-post" />

        {shapes.map((shape, index) => {
          if (!shape) return null;
          const points = shape.map((p) => `${p.x * COURT_W},${NET_Y - p.y * NET_Y}`).join(' ');
          const closed = isComplete(zones[index]);
          const className = `zone-shape${closed ? '' : ' zone-open'}${selecting && index === activeZone ? ' zone-shape-active' : ''}`;
          return closed ? (
            <polygon key={index} points={points} className={className} pointerEvents="none" />
          ) : (
            <polyline key={index} points={points} className={className} pointerEvents="none" />
          );
        })}

        {zones.map((zone, zi) =>
          zone.map((cone, ci) => {
            const cx = cone.x * COURT_W;
            const cy = NET_Y - cone.y * NET_Y;
            return (
              <g
                key={`${zi}-${ci}`}
                data-cone={selecting ? `${zi}-${ci}` : undefined}
                className={`cone${selecting && zi !== activeZone ? ' cone-idle' : ''}`}
                role="img"
                aria-label="Cone"
              >
                <circle cx={cx} cy={cy} r={5.5} className="cone-hit" />
                <ellipse cx={cx} cy={cy + 1.8} rx={2.8} ry={1.1} className="cone-base" />
                <path d={`M${cx} ${cy - 3} L${cx + 2.3} ${cy + 1.8} L${cx - 2.3} ${cy + 1.8} Z`} className="cone-body" />
              </g>
            );
          }),
        )}
      </svg>

      <span className="court-label t-label-xs" style={{ top: `${pct(BAND / 2, box.y, box.h)}%` }}>
        OPPONENT
      </span>
      {view === 'full' && (
        <span
          className="court-label t-label-xs"
          style={{ top: `${pct(COURT_H - BAND / 2, box.y, box.h)}%` }}
        >
          YOU
        </span>
      )}

      <svg
        className="court-svg court-dots"
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        aria-hidden={dots.length === 0}
      >
        {dots.map((dot) => {
          const { x, y } = dotPosition(dot);
          const state = dotState(dot);
          return (
            <g
              key={dot.id}
              className={`dot dot-${state}`}
              role="button"
              tabIndex={mode === 'results' ? 0 : -1}
              aria-label={tooltipText(dot)}
              onClick={(event) => {
                event.stopPropagation();
                if (mode === 'results') setActiveDot(dot.id);
              }}
              onKeyDown={(event) => {
                if (mode === 'results' && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  setActiveDot(dot.id);
                }
              }}
            >
              {state === 'out' ? (
                <circle cx={x} cy={y} r={DOT_R * 1.2} className="dot-ring" />
              ) : (
                <circle cx={x} cy={y} r={DOT_R} className="dot-core" />
              )}
              <circle cx={x} cy={y} r={DOT_HIT_R} className="dot-hit" />
            </g>
          );
        })}
      </svg>

      {active && mode === 'results' && (
        <div
          className="court-tooltip"
          style={{
            left: `${pct(dotPosition(active).x, box.x, box.w)}%`,
            top: `${pct(dotPosition(active).y, box.y, box.h)}%`,
          }}
        >
          <Tooltip>{tooltipText(active)}</Tooltip>
        </div>
      )}
    </div>
  );
}

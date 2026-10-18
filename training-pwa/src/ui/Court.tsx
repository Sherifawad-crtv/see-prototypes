import { useRef, useState, type PointerEvent } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import { areaAround, areaFrom, areaLabel, clamp01, MIN_AREA } from '../domain/court.ts';
import type { Area } from '../domain/types.ts';
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
  areas?: Area[];
  area?: Area | null;
  onAreaChange?: (area: Area) => void;
}

type Point = { x: number; y: number };
type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type Drag =
  | { kind: 'draw'; anchor: Point; moved: boolean }
  | { kind: 'move'; start: Point; origin: Area }
  | { kind: 'resize'; handle: Handle; origin: Area };

const PAD = 2;
const COURT_W = 100;
const COURT_H = 200;
const NET_Y = 100;
const BAND = 30.5;
const DOT_R = 1.55;
const DOT_HIT_R = 4.5;
const HANDLE = 3.4;
const HANDLE_HIT = 6;
const DRAW_THRESHOLD = 0.03;

const HANDLES: { id: Handle; fx: number; fy: number }[] = [
  { id: 'nw', fx: 0, fy: 0 },
  { id: 'n', fx: 0.5, fy: 0 },
  { id: 'ne', fx: 1, fy: 0 },
  { id: 'e', fx: 1, fy: 0.5 },
  { id: 'se', fx: 1, fy: 1 },
  { id: 's', fx: 0.5, fy: 1 },
  { id: 'sw', fx: 0, fy: 1 },
  { id: 'w', fx: 0, fy: 0.5 },
];

function viewBoxOf(view: 'half' | 'full') {
  const height = view === 'full' ? COURT_H : NET_Y;
  return { x: -PAD, y: -PAD, w: COURT_W + PAD * 2, h: height + PAD * 2 };
}

function dotPosition(dot: CourtDot) {
  return { x: clamp01(dot.x) * COURT_W, y: NET_Y - clamp01(dot.y) * NET_Y };
}

function rectOf(area: Area) {
  return {
    x: area.x0 * COURT_W,
    y: NET_Y - area.y1 * NET_Y,
    width: (area.x1 - area.x0) * COURT_W,
    height: (area.y1 - area.y0) * NET_Y,
  };
}

function dotState(dot: CourtDot): 'out' | 'hit' | 'miss' | 'free' {
  if (!dot.inBounds) return 'out';
  if (dot.hit === undefined) return 'free';
  return dot.hit ? 'hit' : 'miss';
}

function resized(origin: Area, handle: Handle, point: Point): Area {
  let { x0, y0, x1, y1 } = origin;
  if (handle.includes('w')) x0 = Math.min(point.x, x1 - MIN_AREA);
  if (handle.includes('e')) x1 = Math.max(point.x, x0 + MIN_AREA);
  if (handle === 'n' || handle === 'nw' || handle === 'ne') y1 = Math.max(point.y, y0 + MIN_AREA);
  if (handle === 's' || handle === 'sw' || handle === 'se') y0 = Math.min(point.y, y1 - MIN_AREA);
  return { x0, y0, x1, y1 };
}

function moved(origin: Area, dx: number, dy: number): Area {
  const w = origin.x1 - origin.x0;
  const h = origin.y1 - origin.y0;
  const x0 = Math.min(1 - w, Math.max(0, origin.x0 + dx));
  const y0 = Math.min(1 - h, Math.max(0, origin.y0 + dy));
  return { x0, y0, x1: x0 + w, y1: y0 + h };
}

export function Court({
  mode,
  view,
  dots = [],
  areas = [],
  area = null,
  onAreaChange,
}: CourtProps) {
  const box = viewBoxOf(view);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
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
    const point = toCourt(event);
    const handle = (event.target as Element).closest('[data-handle]')?.getAttribute('data-handle') as Handle | null;
    if (area && handle) drag.current = { kind: 'resize', handle, origin: area };
    else if (area && point.x >= area.x0 && point.x <= area.x1 && point.y >= area.y0 && point.y <= area.y1) {
      drag.current = { kind: 'move', start: point, origin: area };
    } else drag.current = { kind: 'draw', anchor: point, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    if (!current || !onAreaChange) return;
    const point = toCourt(event);
    if (current.kind === 'draw') {
      if (Math.hypot(point.x - current.anchor.x, point.y - current.anchor.y) < DRAW_THRESHOLD) return;
      current.moved = true;
      const next = areaFrom(current.anchor, point);
      if (next.x1 - next.x0 >= MIN_AREA && next.y1 - next.y0 >= MIN_AREA) onAreaChange(next);
    } else if (current.kind === 'move') {
      onAreaChange(moved(current.origin, point.x - current.start.x, point.y - current.start.y));
    } else {
      onAreaChange(resized(current.origin, current.handle, point));
    }
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    drag.current = null;
    if (current?.kind === 'draw' && !current.moved) onAreaChange?.(areaAround(toCourt(event)));
  };

  const tooltipText = (dot: CourtDot) => {
    if (dot.hit === undefined) return shotLabel(dot.shotId);
    const state = dotState(dot);
    const result = state === 'hit' ? 'Hit' : state === 'miss' ? 'Miss' : 'Out';
    return `${shotLabel(dot.shotId)} · ${result}`;
  };

  const editRect = area ? rectOf(area) : null;

  return (
    <div className="court">
      <svg
        ref={svgRef}
        className={`court-svg${selecting ? ' court-draw' : ''}`}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="img"
        aria-label={selecting ? 'Padel court. Drag to draw your target area' : 'Padel court, opponent half at the top'}
        onClick={() => setActiveDot(null)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
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

        {areas.map((outline, index) => (
          <rect key={index} {...rectOf(outline)} className="area area-outline" pointerEvents="none" />
        ))}

        {selecting && editRect && (
          <g>
            <rect {...editRect} className="area area-edit" />
            {HANDLES.map((handle) => (
              <g
                key={handle.id}
                data-handle={handle.id}
                className={`handle handle-${handle.id}`}
                transform={`translate(${editRect.x + editRect.width * handle.fx} ${editRect.y + editRect.height * handle.fy})`}
              >
                <rect x={-HANDLE_HIT} y={-HANDLE_HIT} width={HANDLE_HIT * 2} height={HANDLE_HIT * 2} className="handle-hit" />
                <rect x={-HANDLE / 2} y={-HANDLE / 2} width={HANDLE} height={HANDLE} className="handle-box" />
              </g>
            ))}
          </g>
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

      {selecting && area && editRect && (
        <span
          className="area-size t-label-xs"
          style={{
            left: `${pct(editRect.x + editRect.width / 2, box.x, box.w)}%`,
            top: `${pct(editRect.y + editRect.height, box.y, box.h)}%`,
          }}
        >
          {areaLabel(area)}
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

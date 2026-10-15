import { useState, type KeyboardEvent } from 'react';
import { shotLabel } from '../domain/catalog.ts';
import type { ZoneId } from '../domain/types.ts';
import { getZone, ZONES } from '../domain/zones.ts';
import { Tooltip } from './controls.tsx';
import { Check } from './icons.tsx';

export interface CourtDot {
  id: string;
  shotId: string;
  x: number;
  y: number;
  inBounds: boolean;
  hit?: boolean;
  latest?: boolean;
}

export interface CourtZone {
  id: ZoneId;
  emphasis: 'target' | 'outline';
}

interface CourtProps {
  mode: 'select' | 'live' | 'results';
  view: 'half' | 'full';
  dots?: CourtDot[];
  zones?: CourtZone[];
  selectedZone?: ZoneId | null;
  onSelectZone?: (zone: ZoneId) => void;
  targeted?: boolean;
}

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
  const x = Math.min(1, Math.max(0, dot.x)) * COURT_W;
  const y = NET_Y - Math.min(1, Math.max(0, dot.y)) * NET_Y;
  return { x, y };
}

function zoneRect(id: ZoneId) {
  const zone = getZone(id);
  return {
    x: zone.x0 * COURT_W,
    y: NET_Y - zone.y1 * NET_Y,
    width: (zone.x1 - zone.x0) * COURT_W,
    height: (zone.y1 - zone.y0) * NET_Y,
  };
}

function dotState(dot: CourtDot, targeted: boolean): 'out' | 'hit' | 'miss' | 'free' {
  if (!dot.inBounds) return 'out';
  if (!targeted) return 'free';
  return dot.hit ? 'hit' : 'miss';
}

export function Court({
  mode,
  view,
  dots = [],
  zones = [],
  selectedZone = null,
  onSelectZone,
  targeted = false,
}: CourtProps) {
  const box = viewBoxOf(view);
  const [activeDot, setActiveDot] = useState<string | null>(null);
  const active = dots.find((dot) => dot.id === activeDot);
  const pct = (value: number, origin: number, size: number) => ((value - origin) / size) * 100;

  const onZoneKey = (event: KeyboardEvent, id: ZoneId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectZone?.(id);
    }
  };

  const tooltipText = (dot: CourtDot) => {
    if (!targeted) return shotLabel(dot.shotId);
    const state = dotState(dot, true);
    const result = state === 'hit' ? 'Hit' : state === 'miss' ? 'Miss' : 'Out';
    return `${shotLabel(dot.shotId)} · ${result}`;
  };

  return (
    <div className="court">
      <svg
        className="court-svg"
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="img"
        aria-label="Padel court, opponent half at the top"
        onClick={() => setActiveDot(null)}
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

        {mode === 'select' &&
          ZONES.map((zone) => {
            const rect = zoneRect(zone.id);
            const selected = selectedZone === zone.id;
            return (
              <rect
                key={zone.id}
                {...rect}
                role="button"
                tabIndex={0}
                aria-label={zone.label}
                aria-pressed={selected}
                className={`zone zone-tap${selected ? ' zone-target' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectZone?.(zone.id);
                }}
                onKeyDown={(event) => onZoneKey(event, zone.id)}
              />
            );
          })}

        {mode !== 'select' &&
          zones.map((zone) => (
            <rect
              key={`${zone.id}-${zone.emphasis}`}
              {...zoneRect(zone.id)}
              className={`zone ${zone.emphasis === 'target' ? 'zone-target' : 'zone-outline'}`}
              pointerEvents="none"
            />
          ))}
      </svg>

      {mode === 'select' &&
        ZONES.map((zone) => {
          const selected = selectedZone === zone.id;
          return (
            <span
              key={zone.id}
              className={`zone-label t-label-sm${selected ? ' zone-label-on' : ''}`}
              style={{
                left: `${pct(zone.cx * COURT_W, box.x, box.w)}%`,
                top: `${pct(NET_Y - zone.cy * NET_Y, box.y, box.h)}%`,
              }}
            >
              {selected && <Check />}
              {zone.label}
            </span>
          );
        })}
      {mode !== 'select' && (
        <span
          className="court-label t-label-xs"
          style={{ top: `${pct(BAND / 2, box.y, box.h)}%` }}
        >
          OPPONENT
        </span>
      )}
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
          const state = dotState(dot, targeted);
          return (
            <g
              key={dot.id}
              className={`dot dot-${state}${mode === 'live' ? ' dot-drop' : ''}`}
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
              {dot.latest && <circle cx={x} cy={y} r={DOT_R * 2.2} className="dot-pulse" />}
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

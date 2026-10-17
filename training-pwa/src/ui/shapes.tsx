export type ShapeKind = 'flame' | 'swoosh' | 'court';

/** Decorative artwork placed behind colour blocks. Decorative only, hidden from assistive tech. */
export function Shape({ kind }: { kind: ShapeKind }) {
  return (
    <svg className={`shape shape-${kind}`} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      {kind === 'flame' && (
        <>
          <path
            className="shape-a"
            d="M70 4c4 20 26 30 30 56 3 24-14 52-40 54C32 116 14 98 18 72c3-16 14-24 20-38 4 10 10 14 14 12 4-12 2-28 18-42z"
          />
          <path
            className="shape-b"
            d="M62 52c3 12 18 18 20 34 2 14-9 26-24 26-14 0-24-12-20-26 2-8 8-12 12-20 4 6 6 8 10 6 2-6 0-12 2-20z"
          />
        </>
      )}
      {kind === 'swoosh' && (
        <>
          <path className="shape-a" d="M0 70C40 52 80 40 120 18v38C84 74 40 84 0 104z" />
          <path className="shape-b" d="M0 96c40-18 80-30 120-52v28c-40 22-80 34-120 52z" />
        </>
      )}
      {kind === 'court' && (
        <g className="shape-line">
          <rect x="14" y="6" width="92" height="108" rx="4" />
          <path d="M14 60h92M60 24v72M14 24h92M14 96h92" />
        </g>
      )}
    </svg>
  );
}

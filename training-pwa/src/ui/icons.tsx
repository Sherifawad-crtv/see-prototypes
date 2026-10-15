import type { ReactNode, SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ChevronLeft = () => (
  <Icon>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);
export const ChevronUp = () => (
  <Icon>
    <path d="M5 15l7-7 7 7" />
  </Icon>
);
export const ChevronDown = () => (
  <Icon>
    <path d="M5 9l7 7 7-7" />
  </Icon>
);
export const Plus = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const Minus = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
);
export const Repeat = () => (
  <Icon>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Icon>
);
export const Trash = () => (
  <Icon>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </Icon>
);
export const Play = () => (
  <Icon fill="currentColor" strokeWidth="0">
    <path d="M7 4.5v15l13-7.5z" />
  </Icon>
);
export const Stop = () => (
  <Icon fill="currentColor" strokeWidth="0">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </Icon>
);
export const Camera = () => (
  <Icon>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3" />
  </Icon>
);
export const Check = () => (
  <Icon>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);
export const ChevronRight = () => (
  <Icon>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);
export const Target = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </Icon>
);
export const Bolt = () => (
  <Icon>
    <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />
  </Icon>
);
export const Clock = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
export const Bulb = () => (
  <Icon>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
  </Icon>
);

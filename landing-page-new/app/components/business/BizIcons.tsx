import type { ReactNode, SVGProps } from "react";

/**
 * Small line icons for the `/for-business` pitch (24×24 grid, 2px stroke,
 * `currentColor`). Always decorative — the visible label carries the meaning.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconBag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 8h13l-1.1 12.1a1 1 0 0 1-1 .9H7.6a1 1 0 0 1-1-.9L5.5 8Z" />
    <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
  </Icon>
);

export const IconCard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M7 9v6M9.5 9v6M12 9v6M15 9v6M17 9v6" strokeWidth={1.6} />
  </Icon>
);

export const IconScooter = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="M8 18h7.5L18 6.5h2.5" />
    <path d="M3.5 9.5h7v5.5h-7z" />
  </Icon>
);

export const IconStores = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 4.5h17l1 5h-19l1-5Z" />
    <path d="M4.5 9.5V20h15V9.5" />
    <path d="M10 20v-5h4v5" />
  </Icon>
);

export const IconLink = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3.1-3.1a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3.1 3.1a4 4 0 0 0 5.7 5.7l1-1" />
  </Icon>
);

export const IconGift = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="8" width="18" height="4.5" rx="1" />
    <path d="M5 12.5V20h14v-7.5" />
    <path d="M12 8v12" />
    <path d="M12 8C10.5 5 7 4.5 7 6.6 7 8 9.5 8 12 8Zm0 0c1.5-3 5-3.5 5-1.4C17 8 14.5 8 12 8Z" />
  </Icon>
);

export const IconCalendarStar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="m12 12.6 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3 1-2Z" strokeWidth={1.6} />
  </Icon>
);

export const IconReport = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h8.5L19 7.5V21H6V3Z" />
    <path d="M14.5 3v4.5H19" />
    <path d="M9.5 17.5v-3M12.5 17.5v-6M15.5 17.5v-4" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </Icon>
);

export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const IconMail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);

export const IconCopy = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
  </Icon>
);

export const IconPhone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5h3l1.8 4.6-2.2 1.4a11 11 0 0 0 5.9 5.9l1.4-2.2 4.6 1.8v3a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4 5.6a2 2 0 0 1 2-2.1Z" />
  </Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const IconArrowDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icon>
);

export const IconShield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 5 6v5.2c0 4.4 3 8.3 7 9.8 4-1.5 7-5.4 7-9.8V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
);

export const IconKey = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="15.5" r="4" />
    <path d="m11 12.5 8.5-8.5M16 7.5l2.2 2.2M13.8 9.7l1.6 1.6" />
  </Icon>
);

export const IconScan = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8.5V5a1 1 0 0 1 1-1h3.5M15.5 4H19a1 1 0 0 1 1 1v3.5M20 15.5V19a1 1 0 0 1-1 1h-3.5M8.5 20H5a1 1 0 0 1-1-1v-3.5" />
    <path d="M8 9v6M10.7 9v6M13.3 9v6M16 9v6" strokeWidth={1.6} />
  </Icon>
);

export const IconMapPin = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);

export const IconDevices = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="4.5" width="13" height="10.5" rx="2" />
    <path d="M6.5 19h5M9 15v4" />
    <rect x="15.5" y="8.5" width="6" height="12" rx="1.5" />
  </Icon>
);

/** A filled pistachio badge with an espresso tick — for check lists. */
export function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pistachio text-espresso-dark ${className}`}
    >
      <IconCheck className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  );
}

import type { ReactNode } from 'react';

export type BadgeTone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'brand' | 'purple';

const TONE: Record<BadgeTone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  brand: 'bg-brand-light text-brand',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({
  tone = 'gray',
  children,
  className = '',
  title,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

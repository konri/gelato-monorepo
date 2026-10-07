import type { ReactNode } from 'react';

export function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Optional counter after the label. */
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand text-white' : 'border border-gray-300 text-gray-600 hover:border-gray-400'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
      )}
    </button>
  );
}

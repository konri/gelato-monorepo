import type { ReactNode } from 'react';

export type ChipOption = {
  id: string;
  label: ReactNode;
  /** A selected locked chip cannot be removed (e.g. a city that has spots). */
  locked?: boolean;
  lockedHint?: string;
};

type ChipMultiSelectProps = {
  options: ChipOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  emptyText?: ReactNode;
};

/** Toggleable chips for picking several items (cities, spots). */
export function ChipMultiSelect({ options, value, onChange, disabled = false, emptyText }: ChipMultiSelectProps) {
  const selected = new Set(value);
  if (options.length === 0 && emptyText) return <p className="text-sm text-gray-400">{emptyText}</p>;

  const toggle = (option: ChipOption) => {
    if (disabled) return;
    if (selected.has(option.id)) {
      if (option.locked) return;
      onChange(value.filter((id) => id !== option.id));
    } else {
      onChange([...value, option.id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.has(option.id);
        const locked = on && !!option.locked;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => toggle(option)}
            disabled={disabled}
            aria-pressed={on}
            title={locked ? option.lockedHint : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              on
                ? 'border-brand bg-brand-light text-brand'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            } ${locked ? 'cursor-default' : ''}`}
          >
            {on && (
              <span aria-hidden className="text-xs">
                {locked ? '🔒' : '✓'}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

import type { ReactNode } from 'react';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Boxed row (grey background) as used in forms. */
  boxed?: boolean;
};

/** Labelled on/off switch (a styled checkbox). */
export function Toggle({ checked, onChange, label, description, disabled = false, boxed = true }: ToggleProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 ${
        boxed ? 'rounded-lg border border-gray-200 bg-gray-50 p-4' : ''
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {description && <span className="block text-xs text-gray-500">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:bg-brand checked:before:translate-x-4 disabled:cursor-not-allowed"
      />
    </label>
  );
}

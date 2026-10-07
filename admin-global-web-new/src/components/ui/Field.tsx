import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';

export const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';
export const inputErrorClass = 'border-red-400 focus:border-red-500 focus:ring-red-500';
export const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

type FieldProps = {
  label?: ReactNode;
  /** Shown under the control in grey. */
  hint?: ReactNode;
  /** Shown under the control in red; also marks the control invalid. */
  error?: ReactNode;
  /** Right side of the label row (e.g. "+ Add city"). */
  action?: ReactNode;
  className?: string;
  /** Receives the generated id for the control (label htmlFor). */
  children: (id: string, invalid: boolean) => ReactNode;
};

/** Label + control + hint / error. */
export function Field({ label, hint, error, action, className = '', children }: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      {(label || action) && (
        <div className="mb-1 flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
              {label}
            </label>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children(id, !!error)}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ invalid, className = '', ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? inputErrorClass : ''} ${className}`}
      {...rest}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ invalid, className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? inputErrorClass : ''} ${className}`}
      {...rest}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ invalid, className = '', children, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? inputErrorClass : ''} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

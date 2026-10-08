export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'dangerOutline';
export type ButtonSize = 'sm' | 'md';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dangerOutline: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-brand hover:text-brand-dark',
};

// Small buttons keep a 44 px touch target on phones (below md).
const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 py-1.5 text-xs md:min-h-0',
  md: 'px-4 py-2.5 text-sm',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${variant === 'ghost' ? '' : SIZE[size]} ${extra}`.trim();
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonClass';

export type { ButtonSize, ButtonVariant };

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows `loadingText` (or the children) and disables the button. */
  loading?: boolean;
  loadingText?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  className = '',
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

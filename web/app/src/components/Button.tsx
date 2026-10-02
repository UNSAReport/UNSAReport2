import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'poster-button poster-button-primary',
  secondary: 'poster-button poster-button-dark',
  ghost:
    'inline-flex items-center justify-center gap-2 px-1 py-2 text-sm font-bold uppercase tracking-wider text-[#141414] underline decoration-[#1351AA] decoration-2 underline-offset-4 transition-colors duration-300 hover:text-[#1351AA]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-8 py-4 text-sm',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return `${variantClasses[variant]} ${sizeClasses[size]} touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E3E2DE] ${className}`;
}
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ariaLabel,
  ariaPressed,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`${buttonClasses(variant, size, className)} disabled:opacity-50 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}

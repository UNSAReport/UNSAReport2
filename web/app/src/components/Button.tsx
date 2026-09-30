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
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm focus:ring-indigo-400',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-indigo-500',
  ghost:
    'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 focus:ring-indigo-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
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

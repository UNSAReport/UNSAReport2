import type { CSSProperties, ReactNode } from 'react';

export interface SlideBadgeProps {
  /** Texto o contenido del badge */
  children: ReactNode;
  /** Color o variante temática */
  variant?: 'accent' | 'secondary' | 'success' | 'warning' | 'error' | 'muted';
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const badgeVariants: Record<string, string> = {
  accent:
    'bg-[var(--slide-accent,#800020)]/20 text-[var(--slide-accent-secondary,#D4AF37)] border-[var(--slide-accent,#800020)]/40',
  secondary:
    'bg-[var(--slide-accent-secondary,#D4AF37)]/20 text-[var(--slide-accent-secondary,#D4AF37)] border-[var(--slide-accent-secondary,#D4AF37)]/40',
  success:
    'bg-[var(--slide-success,#10b981)]/20 text-[var(--slide-success,#10b981)] border-[var(--slide-success,#10b981)]/40',
  warning:
    'bg-[var(--slide-warning,#f59e0b)]/20 text-[var(--slide-warning,#f59e0b)] border-[var(--slide-warning,#f59e0b)]/40',
  error:
    'bg-[var(--slide-error,#ef4444)]/20 text-[var(--slide-error,#ef4444)] border-[var(--slide-error,#ef4444)]/40',
  muted:
    'bg-white/10 text-[var(--slide-text-muted,#94a3b8)] border-white/10',
};

/**
 * Insignia visual o tag decorativo para resaltar categorías o estados.
 */
export function SlideBadge({
  children,
  variant = 'accent',
  className = '',
  style = {},
}: SlideBadgeProps) {
  const variantClass = badgeVariants[variant] || badgeVariants.accent;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${variantClass} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

export interface SlideGradientBarProps {
  /** Altura de la barra (ej: '4px', '6px') */
  height?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

/**
 * Barra decorativa con gradiente institucional.
 */
export function SlideGradientBar({
  height = '4px',
  className = '',
  style = {},
}: SlideGradientBarProps) {
  return (
    <div
      className={`w-full bg-gradient-to-r from-[var(--slide-accent,#800020)] via-[var(--slide-accent-secondary,#D4AF37)] to-[var(--slide-accent,#800020)] ${className}`}
      style={{ height, ...style }}
    />
  );
}

import type { CSSProperties, ReactNode } from 'react';

export interface SlideCardProps {
  /** Variante estética de la tarjeta */
  variant?: 'default' | 'elevated' | 'glow' | 'outlined' | 'muted';
  /** Relleno interno (padding) */
  padding?: string | number;
  /** Si tiene efecto interactivo hover o destacado */
  featured?: boolean;
  /** Elementos hijos */
  children: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const variantStyles: Record<string, string> = {
  default:
    'bg-[var(--slide-surface,#131b2e)] border border-[var(--slide-border,rgba(255,255,255,0.08))] text-[var(--slide-text,#f1f5f9)]',
  elevated:
    'bg-[var(--slide-surface,#131b2e)] border border-[var(--slide-border,rgba(255,255,255,0.1))] shadow-xl shadow-black/40 text-[var(--slide-text,#f1f5f9)]',
  glow:
    'bg-[var(--slide-surface,#131b2e)] border border-[var(--slide-accent,#800020)] shadow-[0_0_25px_var(--slide-border-glow,rgba(128,0,32,0.35))] text-[var(--slide-text,#f1f5f9)]',
  outlined:
    'bg-transparent border border-[var(--slide-border,rgba(255,255,255,0.15))] text-[var(--slide-text,#f1f5f9)]',
  muted:
    'bg-[var(--slide-surface-muted,#0f172a)] border border-[var(--slide-border,rgba(255,255,255,0.05))] text-[var(--slide-text-muted,#94a3b8)]',
};

/**
 * Primitiva de tarjeta contenedora con soporte para temas dinámicos (CSS variables).
 */
export function SlideCard({
  variant = 'default',
  padding = '1.5rem',
  featured = false,
  children,
  className = '',
  style = {},
}: SlideCardProps) {
  const chosenVariant = featured && variant === 'default' ? 'glow' : variant;
  const baseClasses = variantStyles[chosenVariant] || variantStyles.default;

  return (
    <div
      className={`rounded-[var(--slide-radius,12px)] transition-all duration-200 flex flex-col justify-between ${baseClasses} ${className}`}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}

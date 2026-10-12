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
  muted: 'bg-white/10 text-[var(--slide-text-muted,#94a3b8)] border-white/10',
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

export interface SlideCheckBadgeProps {
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
  /** Color de los trazos (por defecto, azul de marca Blue #3885AB) */
  color?: string;
}

/**
 * Insignia de verificación de la portada Blue (Freeform 8, image3).
 *
 * El PNG extraído es un icono de 47x27 que sale borroso al ampliarse y puede
 * mostrar una caja negra en el navegador por su chunk bKGD, así que se dibuja
 * como SVG vectorial trazado del alfa original en `#3885AB`.
 */
export function SlideCheckBadge({
  className = '',
  style = {},
  color = '#3885AB',
}: SlideCheckBadgeProps) {
  return (
    <svg
      viewBox="0 0 47 27"
      fill={color}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d="M31.7,0.0L33.6,1.0L34.1,3.0L23.2,14.0L21.2,14.0L20.0,12.0L31.0,0.5Z" />
      <path d="M43.0,0.0L44.0,-0.0L45.1,1.0L45.9,2.0L45.6,3.0L22.4,26.0L21.0,25.3L12.0,16.2L11.6,15.0L12.2,14.0L14.0,13.0L21.0,19.6L22.0,20.2L23.0,19.9L42.0,1.0Z" />
      <path d="M0.8,14.0L2.0,13.1L4.0,14.0L12.8,23.0L12.3,25.0L11.0,26.1L10.0,25.7L0.3,16.0L0.0,14.9Z" />
    </svg>
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
      style={{
        height,
        backgroundImage: 'var(--slide-frame-style)',
        ...style,
      }}
    />
  );
}

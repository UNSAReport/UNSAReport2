import type { CSSProperties } from 'react';

export interface SlideDonutProps {
  /** Valor actual (0 a max) */
  value: number;
  /** Valor máximo de la escala */
  max?: number;
  /** Variante de color del tema */
  tone?: 'accent' | 'success' | 'warning' | 'error' | 'muted';
  /** Diámetro del donut */
  size?: string;
  /** Grosor del anillo */
  thickness?: string;
  /** Etiqueta central */
  label?: string;
  /** Subetiqueta central */
  sublabel?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const toneVars: Record<string, string> = {
  accent: 'var(--slide-accent)',
  success: 'var(--slide-success)',
  warning: 'var(--slide-warning)',
  error: 'var(--slide-error)',
  muted: 'var(--slide-text-muted)',
};

/**
 * Anillo de progreso circular (donut) con etiqueta central.
 */
export function SlideDonut({
  value,
  max = 100,
  tone = 'accent',
  size = '10rem',
  thickness = '8px',
  label,
  sublabel,
  className = '',
  style = {},
}: SlideDonutProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  const color = toneVars[tone] || toneVars.accent;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`relative aspect-square shrink-0 rounded-full flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        border: `${thickness} solid var(--slide-border)`,
        ...style,
      }}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        aria-hidden="true"
        style={{
          border: `${thickness} solid transparent`,
          borderTopColor: color,
          borderRightColor: color,
          transform: `rotate(${(pct / 100) * 360}deg)`,
          opacity: 0.9,
        }}
      />
      {label && (
        <span className="text-4xl font-black font-mono truncate max-w-full min-w-0 px-2">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-xs uppercase font-mono tracking-wider opacity-60 mt-1 line-clamp-2 break-words max-w-full min-w-0 px-2 text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
}

import type { CSSProperties } from 'react';

export interface SlideBarProps {
  /** Valor actual (0 a max) */
  value: number;
  /** Valor máximo de la escala */
  max?: number;
  /** Variante de color del tema */
  tone?: 'accent' | 'success' | 'warning' | 'error' | 'muted';
  /** Altura de la barra */
  height?: string;
  /** Etiqueta accesible */
  label?: string;
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
 * Barra de progreso horizontal temática con valor accesible.
 */
export function SlideBar({
  value,
  max = 100,
  tone = 'accent',
  height = '0.5rem',
  label,
  className = '',
  style = {},
}: SlideBarProps) {
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
      className={`w-full max-w-full min-w-0 rounded-full overflow-hidden border border-[var(--slide-border)] ${className}`}
      style={style}
    >
      <div
        className="h-full rounded-full max-w-full overflow-hidden transition-all"
        style={{ width: `${pct}%`, height, background: color, opacity: 0.85 }}
      />
    </div>
  );
}

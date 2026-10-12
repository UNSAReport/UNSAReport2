import type { CSSProperties } from 'react';

export interface SlideGaugeProps {
  /** Valor actual (0 a max) */
  value: number;
  /** Valor máximo de la escala */
  max?: number;
  /** Variante de color del tema */
  tone?: 'accent' | 'success' | 'warning' | 'error' | 'muted';
  /** Diámetro del medidor */
  size?: string;
  /** Unidad mostrada junto al valor */
  unit?: string;
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
 * Medidor semicircular de capacidad o utilización con aguja rotativa.
 */
export function SlideGauge({
  value,
  max = 100,
  tone = 'accent',
  size = '8rem',
  unit = '%',
  label,
  className = '',
  style = {},
}: SlideGaugeProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const rotation = max > 0 ? (clamped / max) * 360 : 0;
  const color = toneVars[tone] || toneVars.accent;

  return (
    <div
      role="img"
      aria-label={label ?? `Medidor: ${clamped} de ${max}`}
      className={`relative aspect-square shrink-0 rounded-full flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        border: '4px solid var(--slide-border)',
        ...style,
      }}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all"
        aria-hidden="true"
        style={{
          border: '4px solid transparent',
          borderTopColor: color,
          transform: `rotate(${rotation}deg)`,
        }}
      />
      <span className="text-4xl font-black font-mono truncate max-w-full min-w-0 px-2">
        {clamped}
        {unit}
      </span>
    </div>
  );
}

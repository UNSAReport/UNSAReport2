import type { CSSProperties } from 'react';

export interface SlideSparklineProps {
  /** Serie de valores normalizados (cualquier rango, se escala al máximo) */
  values: number[];
  /** Variante de color del tema */
  tone?: 'accent' | 'success' | 'warning' | 'error' | 'muted';
  /** Altura máxima de las barras */
  maxHeight?: string;
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
 * Minigráfico de barras (sparkline) para tendencias compactas.
 */
export function SlideSparkline({
  values,
  tone = 'accent',
  maxHeight = '1.5rem',
  label,
  className = '',
  style = {},
}: SlideSparklineProps) {
  const peak = Math.max(1, ...values.map((v) => Math.abs(v)));
  const color = toneVars[tone] || toneVars.accent;

  return (
    <div
      role="img"
      aria-label={label ?? `Tendencia de ${values.length} puntos`}
      className={`min-h-0 flex items-end gap-1 overflow-hidden opacity-70 ${className}`}
      style={{ maxHeight, ...style }}
    >
      {values.map((v) => {
        const heightPct = Math.max(8, (Math.abs(v) / peak) * 100);
        return (
          <span
            key={`spark-${heightPct.toFixed(1)}-${v}`}
            className="flex-1 min-w-0 rounded-t"
            style={{ height: `${heightPct}%`, background: color }}
          />
        );
      })}
    </div>
  );
}

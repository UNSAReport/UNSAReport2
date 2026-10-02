import type { CSSProperties, ReactNode } from 'react';

export interface SlideDividerProps {
  /** Orientación del divisor */
  orientation?: 'horizontal' | 'vertical';
  /** Grosor de la línea (ej: '1px', '2px') */
  thickness?: string;
  /** Opacidad de la línea (0 a 1) */
  opacity?: number;
  /** Variante de color del tema */
  tone?: 'border' | 'accent' | 'muted';
  /** Espaciado vertical/horizontal alrededor */
  spacing?: string | number;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const toneColors: Record<string, string> = {
  border: 'var(--slide-border)',
  accent: 'var(--slide-accent)',
  muted: 'var(--slide-text-muted)',
};

/**
 * Divisor temático horizontal o vertical que respeta los tokens del tema activo.
 */
export function SlideDivider({
  orientation = 'horizontal',
  thickness = '1px',
  opacity = 0.12,
  tone = 'border',
  spacing = 0,
  children,
  className = '',
  style = {},
}: SlideDividerProps & { children?: ReactNode }) {
  const color = toneColors[tone] || toneColors.border;
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      aria-hidden="true"
      className={`${isHorizontal ? 'w-full' : 'h-full self-stretch'} shrink-0 min-w-0 ${className}`}
      style={{
        ...(isHorizontal
          ? {
              borderTop: `${thickness} solid ${color}`,
              opacity,
              marginTop: spacing,
              marginBottom: spacing,
            }
          : {
              borderLeft: `${thickness} solid ${color}`,
              opacity,
              marginLeft: spacing,
              marginRight: spacing,
            }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

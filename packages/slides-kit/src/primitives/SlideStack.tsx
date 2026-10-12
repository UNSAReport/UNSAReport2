import type { CSSProperties, ReactNode } from 'react';

export interface SlideStackProps {
  /** Dirección del apilamiento */
  direction?: 'vertical' | 'horizontal';
  /** Espaciado entre elementos */
  gap?: string | number;
  /** Alias para gap */
  spacing?: string | number;
  /** Alineación en el eje transversal */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justificación en el eje principal */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Elementos hijos */
  children: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

/**
 * Primitiva de apilamiento flexbox unidireccional (horizontal o vertical).
 */
export function SlideStack({
  direction = 'vertical',
  gap,
  spacing = '1rem',
  align = 'stretch',
  justify = 'start',
  children,
  className = '',
  style = {},
}: SlideStackProps) {
  const dirClass = direction === 'vertical' ? 'flex-col' : 'flex-row';
  const finalGap = gap ?? spacing;

  return (
    <div
      className={`flex ${dirClass} ${alignClasses[align]} ${justifyClasses[justify]} w-full ${className}`}
      style={{ gap: finalGap, ...style }}
    >
      {children}
    </div>
  );
}

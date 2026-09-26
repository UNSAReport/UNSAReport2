import type { CSSProperties, ReactNode } from 'react';

export interface SlideGridProps {
  /** Número de columnas (1 a 12) */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  /** Alias para cols */
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  /** Espaciado entre celdas (en rem o pixels) */
  gap?: string | number;
  /** Elementos hijos */
  children: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

/**
 * Primitiva de cuadrícula para composición espacial de diapositivas.
 */
export function SlideGrid({
  cols = 2,
  columns,
  gap = '1.5rem',
  children,
  className = '',
  style = {},
}: SlideGridProps) {
  const finalCols = columns ?? cols;
  const colClass = colClasses[finalCols] || 'grid-cols-2';

  return (
    <div
      className={`grid ${colClass} w-full h-full items-stretch ${className}`}
      style={{ gap, ...style }}
    >
      {children}
    </div>
  );
}

import type { CSSProperties, ReactNode } from 'react';

export interface SlideSplitProps {
  /** Relación de proporciones entre las dos columnas */
  ratio?: '50-50' | '30-70' | '70-30' | '40-60' | '60-40' | '25-75' | '75-25';
  /** Contenido de la columna izquierda o primaria */
  left: ReactNode;
  /** Contenido de la columna derecha o secundaria */
  right: ReactNode;
  /** Espaciado entre columnas */
  gap?: string | number;
  /** Si se invierte el orden visual */
  reverse?: boolean;
  /** Alineación vertical de las columnas */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

const ratioStyles: Record<string, { left: string; right: string }> = {
  '50-50': { left: '1fr', right: '1fr' },
  '30-70': { left: '3fr', right: '7fr' },
  '70-30': { left: '7fr', right: '3fr' },
  '40-60': { left: '2fr', right: '3fr' },
  '60-40': { left: '3fr', right: '2fr' },
  '25-75': { left: '1fr', right: '3fr' },
  '75-25': { left: '3fr', right: '1fr' },
};

/**
 * Primitiva de división en dos columnas con proporciones asimétricas o simétricas.
 */
export function SlideSplit({
  ratio = '50-50',
  left,
  right,
  gap = '2rem',
  reverse = false,
  align = 'stretch',
  className = '',
  style = {},
}: SlideSplitProps) {
  const { left: leftFr, right: rightFr } = ratioStyles[ratio] || ratioStyles['50-50'];
  const gridTemplate = reverse
    ? `${rightFr} ${leftFr}`
    : `${leftFr} ${rightFr}`;

  const alignClasses: Record<string, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={`grid w-full h-full ${alignClasses[align]} ${className}`}
      style={{
        gridTemplateColumns: gridTemplate,
        gap,
        ...style,
      }}
    >
      {reverse ? (
        <>
          <div className="min-w-0 h-full flex flex-col justify-center">{right}</div>
          <div className="min-w-0 h-full flex flex-col justify-center">{left}</div>
        </>
      ) : (
        <>
          <div className="min-w-0 h-full flex flex-col justify-center">{left}</div>
          <div className="min-w-0 h-full flex flex-col justify-center">{right}</div>
        </>
      )}
    </div>
  );
}

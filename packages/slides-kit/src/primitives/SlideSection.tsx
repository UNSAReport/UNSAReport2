import type { CSSProperties, ReactNode } from 'react';
import { SlideBadge, SlideGradientBar } from '@/primitives/SlideAccent';

export interface SlideSectionProps {
  /** Tag o categoría de la diapositiva */
  tag?: string;
  /** Título principal */
  title?: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Contenido principal de la diapositiva */
  children: ReactNode;
  /** Si debe incluir la barra superior con gradiente */
  withGradientBar?: boolean;
  /** Acciones o pie de diapositiva opcional */
  footer?: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

/**
 * Contenedor estándar de diapositiva institucional con cabecera (tag, título, subtítulo)
 * y barra de gradiente decorativa.
 */
export function SlideSection({
  tag,
  title,
  subtitle,
  children,
  withGradientBar = true,
  footer,
  className = '',
  style = {},
}: SlideSectionProps) {
  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden bg-[var(--slide-bg,#0b0f19)] text-[var(--slide-text,#f1f5f9)] p-10 box-border ${className}`}
      style={style}
    >
      {withGradientBar && (
        <div className="absolute top-0 left-0 right-0">
          <SlideGradientBar height="4px" />
        </div>
      )}

      {/* Header institucional */}
      {(tag || title || subtitle) && (
        <header className="mb-6 flex flex-col items-start gap-2 z-10 shrink-0 min-w-0 max-w-full overflow-hidden">
          {tag && <SlideBadge>{tag}</SlideBadge>}
          {title && (
            <h2
              className="text-4xl font-bold tracking-tight text-[var(--slide-text,#f1f5f9)] leading-tight line-clamp-2 break-words min-w-0 max-w-full overflow-hidden"
              style={{
                fontFamily: 'var(--slide-font-family, inherit)',
                letterSpacing: 'var(--slide-heading-spacing, normal)',
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-[var(--slide-text-muted,#94a3b8)] max-w-3xl line-clamp-2 break-words min-w-0 overflow-hidden">
              {subtitle}
            </p>
          )}
        </header>
      )}

      {/* Cuerpo principal */}
      <main className="flex-1 w-full h-full min-h-0 flex flex-col justify-center z-10">
        {children}
      </main>

      {/* Footer opcional */}
      {footer && (
        <footer className="mt-4 pt-4 border-t border-[var(--slide-border,rgba(255,255,255,0.08))] flex justify-between items-center text-xs text-[var(--slide-text-muted,#94a3b8)] z-10 shrink-0">
          {footer}
        </footer>
      )}

      {withGradientBar && (
        <div className="absolute bottom-0 left-0 right-0">
          <SlideGradientBar height="2px" />
        </div>
      )}
    </div>
  );
}

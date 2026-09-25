import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroCenteredBoldProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal gigante */
  title: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Autor(es) o expositor(es) */
  author?: string;
  /** Fecha o evento */
  date?: string;
  /** Contenido adicional inferior */
  children?: ReactNode;
}

/**
 * Layout de portada con título imponente centrado, subtítulo y metadatos de autor.
 */
export function HeroCenteredBold({
  tag = 'Presentación Oficial',
  title,
  subtitle,
  author,
  date,
  children,
}: HeroCenteredBoldProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto px-6">
        {tag && (
          <div className="mb-6">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h1
          className="text-6xl font-black tracking-tight text-[var(--slide-text,#f1f5f9)] mb-6 leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-2xl text-[var(--slide-text-muted,#94a3b8)] mb-8 font-normal leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}

        {(author || date) && (
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-[var(--slide-accent-secondary,#D4AF37)] pt-4 border-t border-[var(--slide-border,rgba(255,255,255,0.08))] w-full max-w-md">
            {author && <span>{author}</span>}
            {author && date && <span>•</span>}
            {date && (
              <span className="text-[var(--slide-text-muted,#94a3b8)]">
                {date}
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    </SlideSection>
  );
}

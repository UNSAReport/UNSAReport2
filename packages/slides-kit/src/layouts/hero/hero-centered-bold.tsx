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
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col items-center justify-center text-center max-w-4xl mx-auto px-6 overflow-hidden">
        {tag && (
          <div className="mb-6 shrink-0">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h1
          className="text-6xl font-black tracking-tight mb-6 leading-tight line-clamp-2 break-words min-w-0"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-2xl opacity-80 mb-8 font-normal leading-relaxed max-w-2xl line-clamp-3 break-words min-w-0">
            {subtitle}
          </p>
        )}

        {(author || date) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-medium opacity-75 pt-4 border-t border-current/10 w-full max-w-md overflow-hidden shrink-0">
            {author && <span className="truncate max-w-full">{author}</span>}
            {author && date && <span className="shrink-0">•</span>}
            {date && (
              <span className="opacity-70 truncate max-w-full">{date}</span>
            )}
          </div>
        )}

        {children}
      </div>
    </SlideSection>
  );
}

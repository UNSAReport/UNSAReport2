import type { ReactNode } from 'react';
import { SlideDivider } from '@/primitives/SlideDivider';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroCoverPhotoBlobProps {
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
 * Portada estilo pitch con gran título, metadatos y panel decorativo rotado.
 */
export function HeroCoverPhotoBlob({
  tag = 'Presentación',
  title,
  subtitle,
  author,
  date,
  children,
}: HeroCoverPhotoBlobProps) {
  return (
    <SlideSection withGradientBar={true} withBlobAccent={false}>
      <div className="relative flex flex-1 min-h-0 min-w-0 w-full flex-col items-start justify-center max-w-3xl px-6 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 shrink-0"
          style={{
            transform: 'rotate(-8deg)',
            opacity: 0.6,
            background:
              'var(--slide-panel-gradient, linear-gradient(180deg,#A0CEFD,#E4F2FF))',
            border: '1px solid var(--slide-panel-border, transparent)',
            borderRadius: '2rem',
          }}
        />
        {tag && (
          <div
            className="mb-6 shrink-0 relative text-3xl font-black uppercase"
            style={{
              color: 'var(--slide-eyebrow-color, var(--slide-text))',
              letterSpacing: 'var(--slide-eyebrow-tracking, 0.22em)',
              fontFamily: 'var(--slide-heading-font-family, inherit)',
            }}
          >
            {tag}
          </div>
        )}
        <h1
          className="relative font-black tracking-tight mb-6 leading-[0.95] line-clamp-2 break-words min-w-0 max-w-full text-7xl lg:text-8xl"
          style={{ fontFamily: 'var(--slide-heading-font-family, inherit)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="relative text-2xl opacity-80 mb-8 font-normal leading-relaxed max-w-2xl line-clamp-3 break-words min-w-0">
            {subtitle}
          </p>
        )}
        {(author || date) && (
          <div className="relative w-full max-w-md overflow-hidden shrink-0">
            <SlideDivider thickness="1px" opacity={0.6} tone="border" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium opacity-75 pt-4">
              {author && <span className="truncate max-w-full">{author}</span>}
              {author && date && <span className="shrink-0">•</span>}
              {date && (
                <span className="opacity-70 truncate max-w-full">{date}</span>
              )}
            </div>
          </div>
        )}

        {children}
      </div>
    </SlideSection>
  );
}

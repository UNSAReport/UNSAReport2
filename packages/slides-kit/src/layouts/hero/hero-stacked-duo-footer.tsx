import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroStackedDuoFooterProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Primera línea del título apilado */
  line1: string;
  /** Segunda línea del título apilado */
  line2?: string;
  /** Texto inferior izquierdo del pie */
  footerLeft?: string;
  /** Texto inferior derecho del pie */
  footerRight?: string;
}

/**
 * Portada de propuesta con dos líneas apiladas en mayúsculas y barra de pie dual.
 */
export function HeroStackedDuoFooter({
  tag,
  line1,
  line2,
  footerLeft,
  footerRight,
}: HeroStackedDuoFooterProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-5xl mx-auto px-6 overflow-hidden">
        {tag && (
          <div className="mb-6 shrink-0">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h1
          className="font-black uppercase leading-none tracking-tight break-words min-w-0"
          style={{
            fontFamily: 'var(--slide-heading-font-family, inherit)',
            fontSize: 'clamp(2.75rem, 8vw, 5.5rem)',
          }}
        >
          <span className="block line-clamp-2">{line1}</span>
          {line2 && <span className="block line-clamp-2">{line2}</span>}
        </h1>

        {(footerLeft || footerRight) && (
          <div
            className="mt-10 pt-4 flex items-center justify-between gap-4 text-sm font-medium opacity-75 shrink-0 border-t"
            style={{
              borderColor: 'var(--slide-footer-rule, var(--slide-border))',
            }}
          >
            {footerLeft && (
              <span className="truncate min-w-0">{footerLeft}</span>
            )}
            {footerRight && (
              <span className="truncate min-w-0 text-right">{footerRight}</span>
            )}
          </div>
        )}
      </div>
    </SlideSection>
  );
}

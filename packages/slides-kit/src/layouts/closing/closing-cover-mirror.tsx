import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface ClosingCoverMirrorProps {
  /** Etiqueta superior */
  tag?: string;
  /** Primera línea gigante del agradecimiento */
  line1: string;
  /** Segunda línea del agradecimiento */
  line2?: string;
  /** Pie izquierdo */
  footerLeft?: string;
  /** Pie derecho */
  footerRight?: string;
}

/**
 * Cierre que refleja la portada con doble línea gigante y pie dual.
 */
export function ClosingCoverMirror({
  tag = 'Finalización',
  line1,
  line2,
  footerLeft,
  footerRight,
}: ClosingCoverMirrorProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto overflow-hidden">
        {tag && (
          <div className="mb-6 shrink-0">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-7xl font-black tracking-tight leading-tight line-clamp-1 break-words min-w-0 max-w-full shrink-0"
          style={{ fontFamily: 'var(--slide-heading-font-family, inherit)' }}
        >
          {line1}
        </h2>
        {line2 && (
          <h2
            className="text-7xl font-black tracking-tight leading-tight mb-6 line-clamp-1 break-words min-w-0 max-w-full shrink-0 opacity-80"
            style={{ fontFamily: 'var(--slide-heading-font-family, inherit)' }}
          >
            {line2}
          </h2>
        )}

        {(footerLeft || footerRight) && (
          <div
            className="pt-6 mt-8 w-full max-w-lg min-w-0 overflow-hidden shrink-0 border-t"
            style={{
              borderColor: 'var(--slide-footer-rule, var(--slide-border))',
            }}
          >
            <div className="flex items-center justify-between gap-6 text-sm font-medium opacity-75">
              {footerLeft && (
                <span className="truncate min-w-0 text-left">{footerLeft}</span>
              )}
              {footerRight && (
                <span className="truncate min-w-0 text-right opacity-70">
                  {footerRight}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </SlideSection>
  );
}

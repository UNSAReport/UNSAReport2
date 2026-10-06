import { SlideCheckBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroStackedDuoFooterProps {
  /** Etiqueta superior o categoría (Blue S1: COMPANY, junto a la insignia) */
  tag?: string;
  /** Primera línea del título apilado */
  line1: string;
  /** Segunda línea del título apilado */
  line2?: string;
  /** Texto inferior izquierdo del pie */
  footerLeft?: string;
  /** Texto inferior derecho del pie */
  footerRight?: string;
  /** Legado: URL del sello/insignia (S1/S11). Sin uso: la insignia es SVG vectorial integrado. */
  badgeUrl?: string;
  /** Variante del fondo: portada completa o acento tenue de esquina */
  wash?: 'cover' | 'corner';
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
  badgeUrl: _badgeUrl,
  wash = 'cover',
}: HeroStackedDuoFooterProps) {
  return (
    <SlideSection withGradientBar={true} withBlobAccent={false}>
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={
          wash === 'cover'
            ? {
                background:
                  'var(--slide-blob-gradient, radial-gradient(closest-side, rgba(56,133,171,0.55) 0%, rgba(24,80,121,0.85) 55%, rgba(24,80,121,0) 72%)) 22% -58% / 135% 175% no-repeat, var(--slide-wash-base, #F6F2EF)',
              }
            : {
                opacity: 0.35,
                background:
                  'var(--slide-blob-gradient, radial-gradient(closest-side, rgba(56,133,171,0.55) 0%, rgba(24,80,121,0.85) 55%, rgba(24,80,121,0) 72%)) 78% 68% / 60% 90% no-repeat, var(--slide-wash-base, #F6F2EF)',
              }
        }
      />
      <div
        aria-hidden="true"
        className="absolute z-10 flex items-center"
        style={{ left: '5.6%', top: '10%', gap: '0.75rem' }}
      >
        <SlideCheckBadge
          className="block shrink-0"
          style={{ width: '5.2vw', maxWidth: '104px', height: 'auto', aspectRatio: '47 / 27' }}
        />
        {tag && (
          <span
            className="font-bold uppercase whitespace-nowrap"
            style={{
              fontFamily: 'var(--slide-heading-font-family, inherit)',
              fontSize: 'clamp(0.9rem, 1.8vw, 1.35rem)',
              letterSpacing: '0.08em',
              color: 'var(--slide-heading-color, #185079)',
            }}
          >
            {tag}
          </span>
        )}
      </div>
      <div className="relative z-10 flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-5xl mx-auto px-6 overflow-hidden">
        <h1
          className="font-black uppercase tracking-tight break-words min-w-0"
          style={{
            fontFamily: 'var(--slide-heading-font-family, inherit)',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            lineHeight: 0.95,
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

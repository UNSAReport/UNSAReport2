import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface ClosingQACenteredProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  contactEmail?: string;
  contactUrl?: string;
  extraInfo?: string;
}

/**
 * Layout de cierre con llamada a preguntas (Q&A), agradecimiento y tarjetas de contacto institucional.
 */
export function ClosingQACentered({
  tag = 'Fin de la Presentación',
  title = '¿Preguntas o Comentarios?',
  subtitle = 'Muchas gracias por su atención y participación activa.',
  contactEmail,
  contactUrl,
  extraInfo,
}: ClosingQACenteredProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto px-6">
        <div className="mb-6">
          <SlideBadge variant="secondary">{tag}</SlideBadge>
        </div>

        <h2
          className="text-6xl font-black text-[var(--slide-text,#f1f5f9)] mb-4 tracking-tight leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h2>

        <p className="text-xl text-[var(--slide-text-muted,#94a3b8)] mb-8">
          {subtitle}
        </p>

        {(contactEmail || contactUrl || extraInfo) && (
          <SlideCard variant="outlined" className="p-6 w-full max-w-lg">
            <div className="flex flex-col gap-2 text-sm text-[var(--slide-text,#f1f5f9)]">
              {contactEmail && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[var(--slide-accent-secondary,#D4AF37)] font-semibold">
                    Contacto:
                  </span>
                  <span>{contactEmail}</span>
                </div>
              )}
              {contactUrl && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[var(--slide-accent-secondary,#D4AF37)] font-semibold">
                    Repositorio / Web:
                  </span>
                  <span className="text-[var(--slide-text-muted,#94a3b8)]">
                    {contactUrl}
                  </span>
                </div>
              )}
              {extraInfo && (
                <p className="text-xs text-[var(--slide-text-muted,#94a3b8)] mt-2 pt-2 border-t border-white/10">
                  {extraInfo}
                </p>
              )}
            </div>
          </SlideCard>
        )}
      </div>
    </SlideSection>
  );
}

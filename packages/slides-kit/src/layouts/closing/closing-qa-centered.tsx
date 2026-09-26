import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface ClosingQACenteredProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  contactEmail?: string;
  contactSpeaker?: string;
  organization?: string;
  children?: ReactNode;
}

/**
 * Diapositiva final para sesión de preguntas y respuestas (Q&A) y cierre formal.
 */
export function ClosingQACentered({
  tag = 'Fin de la Presentación',
  title = '¿Preguntas o Comentarios?',
  subtitle = 'Agradecemos su atención y abrimos el espacio para el debate académico.',
  contactEmail,
  contactSpeaker,
  organization = 'Universidad Nacional de San Agustín',
  children,
}: ClosingQACenteredProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto px-6">
        {tag && (
          <div className="mb-6">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-6xl font-black mb-4 tracking-tight leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h2>

        <p className="text-xl opacity-80 mb-8">{subtitle}</p>

        {(contactEmail || contactSpeaker) && (
          <SlideCard variant="default" className="p-6 w-full max-w-md">
            <div className="flex flex-col gap-2 text-sm">
              {contactSpeaker && (
                <div>
                  <span className="font-semibold">Expositor: </span>
                  <span>{contactSpeaker}</span>
                </div>
              )}
              {contactEmail && (
                <div>
                  <span className="font-semibold">Contacto: </span>
                  <span className="font-mono opacity-80">{contactEmail}</span>
                </div>
              )}
              {organization && (
                <p className="text-xs opacity-60 mt-2 pt-2 border-t border-current/10">
                  {organization}
                </p>
              )}
            </div>
          </SlideCard>
        )}

        {children}
      </div>
    </SlideSection>
  );
}

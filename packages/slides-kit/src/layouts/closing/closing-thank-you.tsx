import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface ClosingThankYouProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  speaker?: string;
  institution?: string;
}

/**
 * Diapositiva clásica y elegante de agradecimiento final.
 */
export function ClosingThankYou({
  tag = 'Finalización',
  title = '¡Muchas Gracias!',
  subtitle = 'Esperamos que las conclusiones y perspectivas hayan sido de valor.',
  speaker,
  institution = 'Universidad Nacional de San Agustín',
}: ClosingThankYouProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto p-8">
        {tag && (
          <div className="mb-6">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-7xl font-black mb-6 tracking-tight leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h2>

        <p className="text-2xl opacity-80 leading-relaxed max-w-xl mb-10 font-light">
          {subtitle}
        </p>

        {(speaker || institution) && (
          <div className="pt-6 border-t border-current/10 w-full max-w-sm">
            {speaker && <div className="text-lg font-bold">{speaker}</div>}
            {institution && (
              <div className="text-xs opacity-60 mt-1 uppercase tracking-wider">
                {institution}
              </div>
            )}
          </div>
        )}
      </div>
    </SlideSection>
  );
}

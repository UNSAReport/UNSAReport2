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
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto overflow-hidden">
        {tag && (
          <div className="mb-6 shrink-0">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-7xl font-black mb-6 tracking-tight leading-tight line-clamp-2 break-words min-w-0 max-w-full shrink-0"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h2>

        <p className="text-2xl opacity-80 leading-relaxed max-w-xl mb-10 font-light line-clamp-3 break-words min-w-0 shrink-0">
          {subtitle}
        </p>

        {(speaker || institution) && (
          <div className="pt-6 border-t border-current/10 w-full max-w-sm min-w-0 overflow-hidden shrink-0">
            {speaker && (
              <div className="text-lg font-bold line-clamp-1 break-words min-w-0">
                {speaker}
              </div>
            )}
            {institution && (
              <div className="text-xs opacity-60 mt-1 uppercase tracking-wider line-clamp-2 break-words min-w-0">
                {institution}
              </div>
            )}
          </div>
        )}
      </div>
    </SlideSection>
  );
}

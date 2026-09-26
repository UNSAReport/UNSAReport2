import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface QuoteSidebarHighlightProps {
  tag?: string;
  title?: string;
  quote: string;
  author: string;
  role?: string;
  contextText: string;
}

/**
 * Cita destacada en barra lateral con cuerpo de texto analítico al lado derecho.
 */
export function QuoteSidebarHighlight({
  tag = 'Análisis Crítico',
  title = 'Fundamento Teórico y Discusión',
  quote,
  author,
  role,
  contextText,
}: QuoteSidebarHighlightProps) {
  return (
    <SlideSection tag={tag} title={title}>
      <SlideSplit
        ratio="40-60"
        gap="3rem"
        className="my-auto"
        left={
          <SlideCard
            variant="glow"
            className="p-8 justify-between h-full border-l-4 border-l-current"
          >
            <div>
              <span className="text-6xl font-serif opacity-30 select-none block mb-2">
                “
              </span>
              <blockquote className="text-xl italic leading-relaxed mb-6">
                {quote}
              </blockquote>
            </div>
            <div className="pt-4 border-t border-current/10">
              <div className="font-bold text-sm">{author}</div>
              {role && <div className="text-xs opacity-60">{role}</div>}
            </div>
          </SlideCard>
        }
        right={
          <div className="flex flex-col justify-center h-full text-base opacity-90 leading-relaxed">
            <p>{contextText}</p>
          </div>
        }
      />
    </SlideSection>
  );
}

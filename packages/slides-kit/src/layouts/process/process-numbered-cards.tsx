import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface NumberedCardStep {
  number: number;
  title: string;
  description: string;
  deliverable?: string;
}

export interface ProcessNumberedCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: NumberedCardStep[];
}

/**
 * Cuadrícula de tarjetas de etapas numeradas con entregables o productos asociados.
 */
export function ProcessNumberedCards({
  tag = 'Fases del Proyecto',
  title,
  subtitle,
  steps = [],
}: ProcessNumberedCardsProps) {
  const visible = steps.slice(0, 6);
  const cols = visible.length <= 4 ? 2 : 3;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={cols as 2 | 3}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {visible.map((st, idx) => (
          <SlideCard
            key={`num-card-${st.number || idx}`}
            variant="default"
            className="p-6 justify-between h-full min-h-0 min-w-0 overflow-hidden"
          >
            <div className="min-h-0 min-w-0 overflow-hidden">
              <div className="flex justify-between items-baseline gap-4 mb-3">
                <span className="shrink-0 text-3xl font-black font-mono opacity-60">
                  0{st.number}
                </span>
                {st.deliverable && (
                  <span className="min-w-0 truncate text-[10px] uppercase font-mono opacity-50 tracking-wider">
                    Entregable
                  </span>
                )}
              </div>
              <h4 className="text-xl font-bold mb-2 line-clamp-2 break-words min-w-0">
                {st.title}
              </h4>
              <p className="text-sm opacity-75 leading-relaxed line-clamp-3 break-words min-w-0 overflow-hidden">
                {st.description}
              </p>
            </div>
            {st.deliverable && (
              <div className="mt-4 pt-3 border-t border-current/10 text-xs font-mono opacity-80 line-clamp-1 break-words min-w-0 shrink-0">
                📦 {st.deliverable}
              </div>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

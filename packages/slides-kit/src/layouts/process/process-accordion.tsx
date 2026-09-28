import { useState } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface AccordionStepItem {
  id: string;
  stepNumber: number;
  title: string;
  summary: string;
  details: string[];
}

export interface ProcessAccordionProps {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: AccordionStepItem[];
}

/**
 * Proceso en acordeón escalonado para profundizar en etapas metodológicas complejas.
 */
export function ProcessAccordion({
  tag = 'Metodología Detallada',
  title,
  subtitle,
  steps = [],
}: ProcessAccordionProps) {
  const [activeId, setActiveId] = useState(steps[0]?.id || '');
  const visible = steps.slice(0, 4);

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center max-w-4xl mx-auto">
        <SlideStack
          spacing="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {visible.map((st) => {
            const isOpen = st.id === activeId;
            return (
              <button
                type="button"
                key={`acc-${st.id}`}
                className="w-full min-w-0 flex-1 min-h-0 overflow-hidden text-left cursor-pointer"
                onClick={() => setActiveId(isOpen ? '' : st.id)}
              >
                <SlideCard
                  variant={isOpen ? 'glow' : 'default'}
                  className="p-5 transition-all h-full min-h-0 min-w-0 overflow-hidden justify-center"
                >
                  <div className="flex items-center justify-between gap-4 min-w-0">
                    <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
                      <span className="w-8 h-8 shrink-0 rounded-full border border-current font-bold flex items-center justify-center text-xs font-mono">
                        0{st.stepNumber}
                      </span>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h4 className="text-base font-bold truncate min-w-0">
                          {st.title}
                        </h4>
                        <p className="text-xs opacity-75 line-clamp-1 break-words min-w-0 overflow-hidden">
                          {st.summary}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-mono opacity-60 shrink-0">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-3 border-t border-current/10 space-y-2 min-h-0 min-w-0 overflow-hidden">
                      {st.details.slice(0, 3).map((d) => (
                        <p
                          key={`d-${d}`}
                          className="text-xs opacity-85 pl-12 line-clamp-1 break-words min-w-0 overflow-hidden"
                        >
                          • {d}
                        </p>
                      ))}
                    </div>
                  )}
                </SlideCard>
              </button>
            );
          })}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

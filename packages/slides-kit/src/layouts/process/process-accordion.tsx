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

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideStack spacing="1rem">
          {steps.map((st) => {
            const isOpen = st.id === activeId;
            return (
              <button
                type="button"
                key={`acc-${st.id}`}
                className="w-full text-left cursor-pointer"
                onClick={() => setActiveId(isOpen ? '' : st.id)}
              >
                <SlideCard
                  variant={isOpen ? 'glow' : 'default'}
                  className="p-5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full border border-current font-bold flex items-center justify-center text-xs font-mono">
                        0{st.stepNumber}
                      </span>
                      <div>
                        <h4 className="text-base font-bold">{st.title}</h4>
                        <p className="text-xs opacity-75">{st.summary}</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono opacity-60">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-3 border-t border-current/10 space-y-2">
                      {st.details.map((d) => (
                        <p key={`d-${d}`} className="text-xs opacity-85 pl-12">
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

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface VerticalStepItem {
  number: number;
  title: string;
  description: string;
  badge?: string;
  duration?: string;
}

export interface ProcessVerticalStepsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: VerticalStepItem[];
}

/**
 * Proceso vertical continuo con riel conector lateral y tarjetas de fase descriptivas.
 */
export function ProcessVerticalSteps({
  tag = 'Flujo Secuencial',
  title,
  subtitle,
  steps = [],
}: ProcessVerticalStepsProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="relative max-w-4xl mx-auto w-full my-auto pl-8">
        <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-current opacity-20" />

        <SlideStack spacing="1.25rem">
          {steps.map((st, idx) => (
            <div
              key={`proc-v-${st.number || idx}`}
              className="relative flex items-center gap-6"
            >
              <div className="absolute -left-8 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold font-mono">
                {st.number}
              </div>
              <SlideCard
                variant="default"
                className="flex-1 p-4 flex-row items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-base font-bold">{st.title}</h4>
                    {st.badge && (
                      <SlideBadge variant="secondary" className="text-[10px]">
                        {st.badge}
                      </SlideBadge>
                    )}
                  </div>
                  <p className="text-xs opacity-75">{st.description}</p>
                </div>
                {st.duration && (
                  <span className="text-xs font-mono opacity-60 shrink-0 ml-4">
                    {st.duration}
                  </span>
                )}
              </SlideCard>
            </div>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

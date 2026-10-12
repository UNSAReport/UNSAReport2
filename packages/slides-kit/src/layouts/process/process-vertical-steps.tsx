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
  const visible = steps.slice(0, 4);

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center max-w-4xl mx-auto">
        <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden pl-8">
          <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-current opacity-20 pointer-events-none" />

          <SlideStack
            spacing="1.5rem"
            className="flex-1 min-h-0 min-w-0 overflow-hidden"
          >
            {visible.map((st, idx) => (
              <div
                key={`proc-v-${st.number || idx}`}
                className="relative flex items-center gap-6 flex-1 min-h-0 min-w-0 overflow-hidden"
              >
                <div className="absolute -left-8 w-6 h-6 shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold font-mono">
                  {st.number}
                </div>
                <SlideCard
                  variant="default"
                  className="flex-1 p-4 flex-row items-center justify-between min-h-0 min-w-0 overflow-hidden"
                >
                  <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-3 mb-1 min-w-0">
                      <h4 className="text-base font-bold truncate min-w-0">
                        {st.title}
                      </h4>
                      {st.badge && (
                        <SlideBadge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {st.badge}
                        </SlideBadge>
                      )}
                    </div>
                    <p className="text-xs opacity-75 line-clamp-2 break-words min-w-0 overflow-hidden">
                      {st.description}
                    </p>
                  </div>
                  {st.duration && (
                    <span className="text-xs font-mono opacity-60 shrink-0 ml-4 truncate">
                      {st.duration}
                    </span>
                  )}
                </SlideCard>
              </div>
            ))}
          </SlideStack>
        </div>
      </div>
    </SlideSection>
  );
}

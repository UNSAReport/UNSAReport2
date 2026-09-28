import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface NextStepItem {
  phase: string;
  action: string;
  timeline?: string;
}

export interface ClosingNextStepsProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  steps: NextStepItem[];
}

/**
 * Diapositiva de próximos pasos estructurados o plan de continuidad del proyecto.
 */
export function ClosingNextSteps({
  tag = 'Hoja de Ruta',
  title = 'Próximos Pasos y Continuidad',
  subtitle = 'Fases inmediatas posteriores al cierre de esta etapa de investigación.',
  steps = [],
}: ClosingNextStepsProps) {
  const visibleSteps = steps.slice(0, 4);
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex-1 min-h-0 min-w-0 w-full max-w-4xl mx-auto flex flex-col justify-center overflow-hidden">
        <SlideStack spacing="1rem" className="min-h-0 min-w-0 overflow-hidden">
          {visibleSteps.map((step, idx) => (
            <SlideCard
              key={`next-step-${step.phase || idx}`}
              variant="default"
              className="p-5 flex-row items-center justify-between min-w-0 shrink-0"
            >
              <div className="flex items-center gap-6 min-w-0">
                <SlideBadge variant="accent">0{idx + 1}</SlideBadge>
                <div className="min-w-0">
                  <span className="text-lg font-bold block line-clamp-1 break-words min-w-0">
                    {step.phase}
                  </span>
                  <span className="text-sm opacity-80 block line-clamp-2 break-words min-w-0">
                    {step.action}
                  </span>
                </div>
              </div>
              {step.timeline && (
                <span className="text-xs font-mono opacity-60 shrink-0 ml-4 line-clamp-1 break-words">
                  {step.timeline}
                </span>
              )}
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

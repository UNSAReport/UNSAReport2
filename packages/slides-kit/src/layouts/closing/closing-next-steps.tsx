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
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideStack spacing="1.25rem">
          {steps.map((step, idx) => (
            <SlideCard
              key={`next-step-${step.phase || idx}`}
              variant="default"
              className="p-5 flex-row items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <SlideBadge variant="accent">0{idx + 1}</SlideBadge>
                <div>
                  <span className="text-lg font-bold block">{step.phase}</span>
                  <span className="text-sm opacity-80 block">
                    {step.action}
                  </span>
                </div>
              </div>
              {step.timeline && (
                <span className="text-xs font-mono opacity-60">
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

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface NumberedStepItem {
  title: string;
  description: string;
}

export interface SplitNumberedStepsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  overviewTitle: string;
  overviewText: string;
  steps: NumberedStepItem[];
}

/**
 * Resumen metodológico a la izquierda y lista secuencial numerada de pasos a la derecha.
 */
export function SplitNumberedSteps({
  tag,
  title,
  subtitle,
  overviewTitle,
  overviewText,
  steps = [],
}: SplitNumberedStepsProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="40-60"
        gap="2.5rem"
        left={
          <div className="flex flex-col justify-center h-full p-4">
            <h3 className="text-3xl font-bold mb-4">{overviewTitle}</h3>
            <p className="text-base opacity-80 leading-relaxed mb-6">
              {overviewText}
            </p>
            <div>
              <SlideBadge variant="accent">Metodología Secuencial</SlideBadge>
            </div>
          </div>
        }
        right={
          <div className="flex flex-col justify-center h-full gap-4">
            {steps.map((st, idx) => (
              <SlideCard
                key={`num-step-${st.title || idx}`}
                variant="default"
                className="p-4 flex-row items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full border border-current font-bold flex items-center justify-center shrink-0 font-mono text-sm opacity-90">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="text-base font-bold">{st.title}</h4>
                  <p className="text-xs opacity-75">{st.description}</p>
                </div>
              </SlideCard>
            ))}
          </div>
        }
      />
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface CodeEvolutionStep {
  step: number;
  label: string;
  code: string;
  note: string;
}

export interface CodeStepByStepProps {
  tag?: string;
  title: string;
  subtitle?: string;
  language?: string;
  steps: CodeEvolutionStep[];
}

/**
 * Evolución de código paso a paso mostrando la transformación gradual de un algoritmo o componente.
 */
export function CodeStepByStep({
  tag = 'Evolución de Código',
  title,
  subtitle,
  language = 'typescript',
  steps = [],
}: CodeStepByStepProps) {
  const currentStep = steps[0];

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <SlideSplit
          ratio="60-40"
          gap="1.5rem"
          className="min-h-0 flex-1"
          left={
            <SlideCard
              variant="elevated"
              padding={0}
              className="h-full min-h-0 min-w-0 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-current/10 shrink-0 min-w-0">
                <span className="text-xs font-mono opacity-70 truncate min-w-0 flex-1">
                  Paso {currentStep?.step}: {currentStep?.label}
                </span>
                <SlideBadge
                  variant="secondary"
                  className="text-[10px] font-mono shrink-0"
                >
                  {language}
                </SlideBadge>
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-6 font-mono text-sm leading-relaxed">
                <pre className="m-0 h-full min-w-0 overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {currentStep?.code}
                  </code>
                </pre>
              </div>
            </SlideCard>
          }
          right={
            <div className="flex h-full min-h-0 min-w-0 flex-col justify-center gap-4 overflow-hidden">
              {steps.slice(0, 4).map((st, idx) => (
                <SlideCard
                  key={`code-step-${st.step || idx}`}
                  variant={idx === 0 ? 'glow' : 'default'}
                  className="p-4 flex-row items-start gap-4 min-w-0 overflow-hidden shrink-0"
                >
                  <span className="w-6 h-6 rounded-full border border-current font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                    {st.step}
                  </span>
                  <div className="min-w-0 overflow-hidden">
                    <h4 className="text-sm font-bold mb-1 line-clamp-1 break-words min-w-0">
                      {st.label}
                    </h4>
                    <p className="text-xs opacity-75 leading-relaxed line-clamp-2 break-words min-w-0">
                      {st.note}
                    </p>
                  </div>
                </SlideCard>
              ))}
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

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
      <SlideSplit
        ratio="60-40"
        gap="2rem"
        left={
          <SlideCard
            variant="elevated"
            padding={0}
            className="h-full overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-xs font-mono opacity-70">
                Paso {currentStep?.step}: {currentStep?.label}
              </span>
              <SlideBadge variant="secondary" className="text-[10px] font-mono">
                {language}
              </SlideBadge>
            </div>
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)]">
              <pre className="m-0">
                <code>{currentStep?.code}</code>
              </pre>
            </div>
          </SlideCard>
        }
        right={
          <div className="flex flex-col justify-center h-full space-y-4">
            {steps.map((st, idx) => (
              <SlideCard
                key={`code-step-${st.step || idx}`}
                variant={idx === 0 ? 'glow' : 'default'}
                className="p-4"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-6 h-6 rounded-full border border-current font-bold flex items-center justify-center text-xs font-mono">
                    {st.step}
                  </span>
                  <h4 className="text-sm font-bold">{st.label}</h4>
                </div>
                <p className="text-xs opacity-75 pl-9">{st.note}</p>
              </SlideCard>
            ))}
          </div>
        }
      />
    </SlideSection>
  );
}

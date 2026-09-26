import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface CodeAnnotation {
  callout: number;
  label: string;
  explanation: string;
}

export interface CodeAnnotatedProps {
  tag?: string;
  title: string;
  subtitle?: string;
  language?: string;
  code: string;
  annotations: CodeAnnotation[];
}

/**
 * Fragmento de código con anotaciones y llamadas numéricas explicativas asociadas.
 */
export function CodeAnnotated({
  tag = 'Explicación de Código',
  title,
  subtitle,
  language = 'typescript',
  code,
  annotations = [],
}: CodeAnnotatedProps) {
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
                Código Anotado
              </span>
              <SlideBadge variant="secondary" className="text-[10px] font-mono">
                {language}
              </SlideBadge>
            </div>
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)]">
              <pre className="m-0">
                <code>{code}</code>
              </pre>
            </div>
          </SlideCard>
        }
        right={
          <div className="flex flex-col justify-center h-full space-y-4">
            {annotations.map((ann, idx) => (
              <SlideCard
                key={`annot-${ann.callout || idx}`}
                variant="default"
                className="p-4 flex-row items-start gap-4"
              >
                <span className="w-7 h-7 rounded-full border border-current font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                  {ann.callout}
                </span>
                <div>
                  <h4 className="text-sm font-bold mb-1">{ann.label}</h4>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {ann.explanation}
                  </p>
                </div>
              </SlideCard>
            ))}
          </div>
        }
      />
    </SlideSection>
  );
}

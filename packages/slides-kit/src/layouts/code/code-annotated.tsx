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
                <span className="text-xs font-mono opacity-70 truncate min-w-0">
                  Código Anotado
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
                  <code className="whitespace-pre-wrap break-all">{code}</code>
                </pre>
              </div>
            </SlideCard>
          }
          right={
            <div className="flex h-full min-h-0 min-w-0 flex-col justify-center gap-4 overflow-hidden">
              {annotations.slice(0, 4).map((ann, idx) => (
                <SlideCard
                  key={`annot-${ann.callout || idx}`}
                  variant="default"
                  className="p-4 flex-row items-start gap-4 min-w-0 overflow-hidden shrink-0"
                >
                  <span className="w-7 h-7 rounded-full border border-current font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                    {ann.callout}
                  </span>
                  <div className="min-w-0 overflow-hidden">
                    <h4 className="text-sm font-bold mb-1 line-clamp-1 break-words min-w-0">
                      {ann.label}
                    </h4>
                    <p className="text-xs opacity-75 leading-relaxed line-clamp-3 break-words min-w-0">
                      {ann.explanation}
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

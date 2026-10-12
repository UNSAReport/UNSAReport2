import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface CodeWithOutputProps {
  tag?: string;
  title: string;
  subtitle?: string;
  language?: string;
  code: string;
  outputTitle?: string;
  output: string;
}

/**
 * Diapositiva que muestra un fragmento de código a la izquierda y su salida/resultado en consola a la derecha.
 */
export function CodeWithOutput({
  tag = 'Ejecución en Vivo',
  title,
  subtitle,
  language = 'typescript',
  code,
  outputTitle = 'Terminal / Stdout',
  output,
}: CodeWithOutputProps) {
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
                  Código Fuente
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
            <SlideCard
              variant="muted"
              padding={0}
              className="h-full min-h-0 min-w-0 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-current/10 shrink-0 min-w-0">
                <span className="text-xs font-mono font-bold opacity-80 truncate min-w-0">
                  {outputTitle}
                </span>
                <SlideBadge
                  variant="success"
                  className="text-[10px] uppercase shrink-0"
                >
                  Salida
                </SlideBadge>
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-6 font-mono text-sm leading-relaxed">
                <pre className="m-0 h-full min-w-0 overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {output}
                  </code>
                </pre>
              </div>
            </SlideCard>
          }
        />
      </div>
    </SlideSection>
  );
}

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
                Código Fuente
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
          <SlideCard
            variant="muted"
            padding={0}
            className="h-full overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-xs font-mono font-bold opacity-80">
                {outputTitle}
              </span>
              <SlideBadge variant="success" className="text-[10px] uppercase">
                Salida
              </SlideBadge>
            </div>
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)]">
              <pre className="m-0">
                <code>{output}</code>
              </pre>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

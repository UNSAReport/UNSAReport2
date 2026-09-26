import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface CodeSplitTerminalProps {
  tag?: string;
  title: string;
  subtitle?: string;
  language?: string;
  code: string;
  commands: Array<{ command: string; output: string }>;
}

/**
 * Diapositiva con código fuente a la izquierda y terminal interactiva de comandos a la derecha.
 */
export function CodeSplitTerminal({
  tag = 'Entorno de Desarrollo',
  title,
  subtitle,
  language = 'bash',
  code,
  commands = [],
}: CodeSplitTerminalProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="elevated"
            padding={0}
            className="h-full overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-xs font-mono opacity-70">
                Script / Config
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
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block" />
                <span className="text-xs font-mono opacity-70 ml-2">
                  bash terminal
                </span>
              </div>
            </div>
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed space-y-4 h-[calc(100%-45px)]">
              {commands.map((cmd) => (
                <div key={`cmd-${cmd.command}`}>
                  <div className="flex items-center gap-2 font-bold opacity-90">
                    <span className="opacity-50">$</span>
                    <span>{cmd.command}</span>
                  </div>
                  <div className="opacity-70 text-xs pl-4 mt-1 whitespace-pre-wrap">
                    {cmd.output}
                  </div>
                </div>
              ))}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

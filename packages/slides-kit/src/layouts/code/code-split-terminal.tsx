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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <SlideSplit
          ratio="50-50"
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
                  Script / Config
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-current/10 shrink-0 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block shrink-0" />
                  <span className="text-xs font-mono opacity-70 ml-2 truncate min-w-0">
                    bash terminal
                  </span>
                </div>
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-auto p-6 font-mono text-sm leading-relaxed">
                <div className="space-y-4 min-w-0">
                  {commands.slice(0, 6).map((cmd) => (
                    <div key={`cmd-${cmd.command}`} className="min-w-0">
                      <div className="flex items-center gap-2 font-bold opacity-90 min-w-0">
                        <span className="opacity-50 shrink-0">$</span>
                        <span className="truncate min-w-0">{cmd.command}</span>
                      </div>
                      <div className="opacity-70 text-xs pl-4 mt-1 whitespace-pre-wrap break-all min-w-0">
                        {cmd.output}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SlideCard>
          }
        />
      </div>
    </SlideSection>
  );
}

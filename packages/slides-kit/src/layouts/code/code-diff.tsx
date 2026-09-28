import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface CodeDiffProps {
  tag?: string;
  title: string;
  subtitle?: string;
  originalTitle?: string;
  originalCode: string;
  modifiedTitle?: string;
  modifiedCode: string;
  language?: string;
}

/**
 * Comparación lado a lado de cambios de código (diff) para refactorizaciones o parches de seguridad.
 */
export function CodeDiff({
  tag = 'Refactorización',
  title,
  subtitle,
  originalTitle = 'Código Original (Legacy)',
  originalCode,
  modifiedTitle = 'Código Optimizado (Nuevo)',
  modifiedCode,
  language = 'typescript',
}: CodeDiffProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <SlideSplit
          ratio="50-50"
          gap="1.5rem"
          className="min-h-0 flex-1"
          left={
            <SlideCard
              variant="muted"
              padding={0}
              className="h-full min-h-0 min-w-0 overflow-hidden border-t-4 border-t-current"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-current/10 shrink-0 min-w-0">
                <span className="text-xs font-mono font-bold opacity-75 truncate min-w-0 flex-1">
                  {originalTitle}
                </span>
                <SlideBadge variant="error" className="text-[10px] shrink-0">
                  Antes
                </SlideBadge>
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-6 font-mono text-sm leading-relaxed opacity-85">
                <pre className="m-0 h-full min-w-0 overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {originalCode}
                  </code>
                </pre>
              </div>
            </SlideCard>
          }
          right={
            <SlideCard
              variant="elevated"
              padding={0}
              className="h-full min-h-0 min-w-0 overflow-hidden border-t-4 border-t-current"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-current/10 shrink-0 min-w-0">
                <span className="text-xs font-mono font-bold opacity-90 truncate min-w-0 flex-1">
                  {modifiedTitle}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <SlideBadge variant="success" className="text-[10px]">
                    Después
                  </SlideBadge>
                  <SlideBadge
                    variant="secondary"
                    className="text-[10px] font-mono"
                  >
                    {language}
                  </SlideBadge>
                </div>
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-6 font-mono text-sm leading-relaxed">
                <pre className="m-0 h-full min-w-0 overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {modifiedCode}
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

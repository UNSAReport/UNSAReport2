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
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="muted"
            padding={0}
            className="h-full overflow-hidden border-t-4 border-t-current"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-xs font-mono font-bold opacity-75">
                {originalTitle}
              </span>
              <SlideBadge variant="error" className="text-[10px]">
                Antes
              </SlideBadge>
            </div>
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)] opacity-85">
              <pre className="m-0">
                <code>{originalCode}</code>
              </pre>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="elevated"
            padding={0}
            className="h-full overflow-hidden border-t-4 border-t-current"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-xs font-mono font-bold opacity-90">
                {modifiedTitle}
              </span>
              <div className="flex items-center gap-2">
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
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)]">
              <pre className="m-0">
                <code>{modifiedCode}</code>
              </pre>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

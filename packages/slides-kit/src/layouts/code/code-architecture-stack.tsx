import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface ArchitectureLayer {
  layer: string;
  technologies: string[];
  description: string;
}

export interface CodeArchitectureStackProps {
  tag?: string;
  title: string;
  subtitle?: string;
  code: string;
  language?: string;
  layers: ArchitectureLayer[];
}

/**
 * Fragmento de código clave acoplado al desglose vertical de capas arquitectónicas del sistema.
 */
export function CodeArchitectureStack({
  tag = 'Arquitectura de Software',
  title,
  subtitle,
  code,
  language = 'typescript',
  layers = [],
}: CodeArchitectureStackProps) {
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
                  Implementación Core
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
              {layers.slice(0, 4).map((l) => (
                <SlideCard
                  key={`layer-${l.layer}`}
                  variant="default"
                  className="p-4 min-w-0 overflow-hidden shrink-0"
                >
                  <div className="flex justify-between items-center gap-2 mb-1 min-w-0">
                    <h4 className="text-sm font-bold truncate min-w-0 flex-1">
                      {l.layer}
                    </h4>
                    <div className="flex gap-1 flex-wrap justify-end shrink-0">
                      {l.technologies.slice(0, 4).map((t) => (
                        <span
                          key={`tech-${t}`}
                          className="text-[10px] font-mono border border-current px-1.5 py-0.5 rounded opacity-75 truncate max-w-28"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs opacity-75 line-clamp-2 break-words min-w-0">
                    {l.description}
                  </p>
                </SlideCard>
              ))}
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

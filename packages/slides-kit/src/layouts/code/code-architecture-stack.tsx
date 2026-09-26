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
                Implementación Core
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
          <div className="flex flex-col justify-center h-full space-y-3">
            {layers.map((l) => (
              <SlideCard
                key={`layer-${l.layer}`}
                variant="default"
                className="p-4"
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold">{l.layer}</h4>
                  <div className="flex gap-1">
                    {l.technologies.map((t) => (
                      <span
                        key={`tech-${t}`}
                        className="text-[10px] font-mono border border-current px-1.5 py-0.5 rounded opacity-75"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs opacity-75">{l.description}</p>
              </SlideCard>
            ))}
          </div>
        }
      />
    </SlideSection>
  );
}

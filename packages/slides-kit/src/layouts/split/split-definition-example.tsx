import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitDefinitionExampleProps {
  tag?: string;
  title: string;
  subtitle?: string;
  term: string;
  pronunciation?: string;
  definition: string;
  implications?: string[];
  exampleTitle?: string;
  exampleContent: ReactNode;
}

/**
 * Definición formal académica a la izquierda y aplicación práctica o ejemplo a la derecha.
 */
export function SplitDefinitionExample({
  tag,
  title,
  subtitle,
  term,
  pronunciation,
  definition,
  implications = [],
  exampleTitle = 'Caso de Aplicación Práctica',
  exampleContent,
}: SplitDefinitionExampleProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="default"
            className="h-full justify-between p-8 border-l-4 border-l-current"
          >
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <h3 className="text-3xl font-extrabold">{term}</h3>
                {pronunciation && (
                  <span className="font-mono text-xs opacity-60">
                    /{pronunciation}/
                  </span>
                )}
              </div>
              <SlideBadge variant="secondary" className="mb-4">
                Definición Formal
              </SlideBadge>
              <p className="text-base leading-relaxed opacity-90 mb-6 italic">
                “{definition}”
              </p>
              {implications.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs uppercase font-mono opacity-60 block">
                    Implicancias Clave:
                  </span>
                  <ul className="space-y-1">
                    {implications.map((imp) => (
                      <li key={`imp-${imp}`} className="text-sm opacity-75">
                        • {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SlideCard>
        }
        right={
          <SlideCard variant="elevated" className="h-full justify-between p-8">
            <div className="border-b border-current/10 pb-3 mb-4 flex justify-between items-center">
              <span className="text-xs uppercase font-mono font-semibold opacity-75">
                {exampleTitle}
              </span>
              <SlideBadge variant="accent">Ejemplo</SlideBadge>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {exampleContent}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

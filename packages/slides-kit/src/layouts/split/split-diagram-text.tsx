import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitDiagramTextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  diagramTitle?: string;
  diagram: ReactNode;
  explanationTitle?: string;
  points: string[];
  children?: ReactNode;
}

/**
 * Diagrama de arquitectura o flujo a la izquierda con puntos explicativos en la derecha.
 */
export function SplitDiagramText({
  tag,
  title,
  subtitle,
  diagramTitle = 'Arquitectura del Sistema',
  diagram,
  explanationTitle = 'Componentes y Flujo',
  points = [],
  children,
}: SplitDiagramTextProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-6"
          >
            <div className="flex justify-between items-center gap-3 border-b border-current/10 pb-3 mb-4 shrink-0">
              <span className="text-xs uppercase font-mono font-semibold opacity-75">
                {diagramTitle}
              </span>
              <SlideBadge variant="secondary">Diagrama</SlideBadge>
            </div>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center p-2 overflow-hidden">
              <div className="w-full max-h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden [&>*]:max-w-full [&>*]:max-h-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto">
                {diagram}
              </div>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="elevated"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-start p-8 space-y-4"
          >
            <h3 className="text-2xl font-bold mb-4 truncate">
              {explanationTitle}
            </h3>
            <ul className="space-y-4 min-h-0 overflow-hidden">
              {points.slice(0, 5).map((pt) => (
                <li
                  key={`diag-pt-${pt}`}
                  className="flex items-start gap-3 text-base opacity-85 leading-relaxed"
                >
                  <span className="font-mono text-xs opacity-60 mt-1 shrink-0">
                    •
                  </span>
                  <span className="min-w-0 break-words line-clamp-2">{pt}</span>
                </li>
              ))}
            </ul>
            {children}
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

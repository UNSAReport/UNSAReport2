import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface SummaryPoint {
  title: string;
  description: string;
}

export interface ClosingSummary3PointsProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  points: SummaryPoint[];
  children?: ReactNode;
}

/**
 * Diapositiva de cierre con 3 conclusiones o puntos clave indispensables.
 */
export function ClosingSummary3Points({
  tag = 'Conclusiones',
  title = 'Puntos Clave para Llevar a Casa',
  subtitle = 'Resumen de los hallazgos e ideas fundamentales presentadas.',
  points = [],
  children,
}: ClosingSummary3PointsProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        columns={3}
        gap="2rem"
        className="h-full items-stretch my-auto"
      >
        {points.map((pt, idx) => (
          <SlideCard
            key={`summary-pt-${pt.title || idx}`}
            variant="elevated"
            className="p-8 justify-between h-full"
          >
            <div>
              <div className="mb-4">
                <SlideBadge variant="secondary">0{idx + 1}</SlideBadge>
              </div>
              <h3 className="text-2xl font-bold mb-3">{pt.title}</h3>
              <p className="text-base opacity-80 leading-relaxed">
                {pt.description}
              </p>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
      {children}
    </SlideSection>
  );
}

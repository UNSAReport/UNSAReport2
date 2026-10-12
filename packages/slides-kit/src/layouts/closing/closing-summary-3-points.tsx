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
  const visiblePoints = points.slice(0, 3);
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden">
        <SlideGrid
          columns={3}
          gap="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden items-stretch"
        >
          {visiblePoints.map((pt, idx) => (
            <SlideCard
              key={`summary-pt-${pt.title || idx}`}
              variant="elevated"
              className="p-8 min-h-0 min-w-0 overflow-hidden"
            >
              <div className="min-h-0 min-w-0 overflow-hidden">
                <div className="mb-4 shrink-0">
                  <SlideBadge variant="secondary">0{idx + 1}</SlideBadge>
                </div>
                <h3 className="text-2xl font-bold mb-3 line-clamp-2 break-words min-w-0">
                  {pt.title}
                </h3>
                <p className="text-base opacity-80 leading-relaxed line-clamp-6 break-words min-w-0">
                  {pt.description}
                </p>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
        {children}
      </div>
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface StatGridItem {
  metric: string;
  label: string;
  detail?: string;
  badge?: string;
}

export interface Stats4GridProps {
  tag?: string;
  title: string;
  subtitle?: string;
  stats: StatGridItem[];
}

/**
 * Cuadrícula 2x2 de métricas balanceadas para informes de rendimiento multidimensionales.
 */
export function Stats4Grid({
  tag = 'Indicadores de Rendimiento',
  title,
  subtitle,
  stats = [],
}: Stats4GridProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={2} gap="1.5rem" className="my-auto">
        {stats.slice(0, 4).map((item, idx) => (
          <SlideCard
            key={`stat-grid-${item.label || idx}`}
            variant="default"
            className="p-6 justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase font-mono opacity-60 font-semibold">
                {item.label}
              </span>
              {item.badge && (
                <SlideBadge variant="secondary" className="text-[10px]">
                  {item.badge}
                </SlideBadge>
              )}
            </div>
            <div className="text-5xl font-black tracking-tight mb-2">
              {item.metric}
            </div>
            {item.detail && (
              <p className="text-xs opacity-70 border-t border-current/10 pt-2">
                {item.detail}
              </p>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

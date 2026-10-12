import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDivider } from '@/primitives/SlideDivider';
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
      <SlideGrid
        cols={2}
        gap="1.5rem"
        className="flex-1 min-h-0"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        {stats.slice(0, 4).map((item, idx) => (
          <SlideCard
            key={`stat-grid-${item.label || idx}`}
            variant="default"
            className="p-6 justify-center min-w-0 min-h-0 overflow-hidden"
          >
            <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
              <span className="text-xs uppercase font-mono opacity-60 font-semibold line-clamp-2 break-words min-w-0">
                {item.label}
              </span>
              {item.badge && (
                <SlideBadge
                  variant="secondary"
                  className="text-[10px] shrink-0"
                >
                  {item.badge}
                </SlideBadge>
              )}
            </div>
            <div className="text-4xl font-black tracking-tight mb-2 tabular-nums truncate">
              {item.metric}
            </div>
            {item.detail && (
              <div className="min-w-0">
                <SlideDivider thickness="1px" opacity={0.12} />
                <p className="text-xs opacity-70 pt-2 line-clamp-2 break-words">
                  {item.detail}
                </p>
              </div>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

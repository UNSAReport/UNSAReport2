import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface StatChangeItem {
  metric: string;
  label: string;
  change: string;
  isPositive: boolean;
  timeframe?: string;
}

export interface StatsWithChangeProps {
  tag?: string;
  title: string;
  subtitle?: string;
  stats: StatChangeItem[];
}

/**
 * Métricas con variación porcentual / delta comparativo respecto a un periodo anterior.
 */
export function StatsWithChange({
  tag = 'Comparativa Temporal',
  title,
  subtitle,
  stats = [],
}: StatsWithChangeProps) {
  const cols = stats.length <= 3 ? 3 : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={cols as 3 | 4}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {stats.map((item, idx) => (
          <SlideCard
            key={`stat-ch-${item.label || idx}`}
            variant="default"
            className="p-6 justify-between min-h-0 min-w-0 overflow-hidden"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <span className="text-xs uppercase font-mono opacity-60 block mb-2 truncate min-w-0">
                {item.label}
              </span>
              <div className="text-5xl font-black tracking-tight mb-4 truncate min-w-0">
                {item.metric}
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 border-t border-current/10 pt-3 shrink-0 min-w-0">
              <SlideBadge
                variant={item.isPositive ? 'success' : 'error'}
                className="text-xs shrink-0"
              >
                {item.isPositive ? `+${item.change}` : `-${item.change}`}
              </SlideBadge>
              {item.timeframe && (
                <span className="text-[10px] opacity-60 font-mono truncate min-w-0 flex-1 text-right">
                  {item.timeframe}
                </span>
              )}
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

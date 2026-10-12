import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface RankedItem {
  rank: number;
  entity: string;
  score: string;
  metricLabel: string;
  badge?: string;
}

export interface StatsRankedListProps {
  tag?: string;
  title: string;
  subtitle?: string;
  ranking: RankedItem[];
}

/**
 * Tabla o lista clasificada de benchmarking con posiciones ordenadas (#1, #2, #3).
 */
export function StatsRankedList({
  tag = 'Benchmarking',
  title,
  subtitle,
  ranking = [],
}: StatsRankedListProps) {
  return (
    <SlideSection
      tag={tag}
      title={title}
      subtitle={subtitle}
      className="w-full h-full overflow-hidden"
    >
      <div className="w-full min-h-0 min-w-0 flex-1 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto w-full min-h-0 flex-1 overflow-hidden flex flex-col">
          <SlideStack spacing="1rem" className="min-h-0 flex-1 overflow-hidden">
            {ranking.map((item, idx) => (
              <SlideCard
                key={`rank-${item.entity || idx}`}
                variant={item.rank === 1 ? 'glow' : 'default'}
                className="p-4 flex-row items-center justify-between gap-4 min-w-0 shrink-0 overflow-hidden"
              >
                <div className="flex items-center gap-6 min-w-0 flex-1">
                  <span className="font-mono text-2xl font-black w-10 shrink-0 text-center opacity-70">
                    #{item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold truncate min-w-0">
                      {item.entity}
                    </h4>
                    <span className="text-xs opacity-60 font-mono line-clamp-1 break-words min-w-0 block">
                      {item.metricLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 min-w-0">
                  {item.badge && (
                    <SlideBadge
                      variant="secondary"
                      className="text-xs shrink-0 max-w-full"
                    >
                      {item.badge}
                    </SlideBadge>
                  )}
                  <span className="text-2xl font-black font-mono truncate shrink-0">
                    {item.score}
                  </span>
                </div>
              </SlideCard>
            ))}
          </SlideStack>
        </div>
      </div>
    </SlideSection>
  );
}

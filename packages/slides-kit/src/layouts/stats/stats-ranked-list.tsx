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
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideStack spacing="1rem">
          {ranking.map((item, idx) => (
            <SlideCard
              key={`rank-${item.entity || idx}`}
              variant={item.rank === 1 ? 'glow' : 'default'}
              className="p-4 flex-row items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <span className="font-mono text-2xl font-black w-10 text-center opacity-70">
                  #{item.rank}
                </span>
                <div>
                  <h4 className="text-base font-bold">{item.entity}</h4>
                  <span className="text-xs opacity-60 font-mono">
                    {item.metricLabel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {item.badge && (
                  <SlideBadge variant="secondary" className="text-xs">
                    {item.badge}
                  </SlideBadge>
                )}
                <span className="text-2xl font-black font-mono">
                  {item.score}
                </span>
              </div>
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

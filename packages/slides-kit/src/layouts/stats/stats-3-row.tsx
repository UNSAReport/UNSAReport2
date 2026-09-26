import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface StatItem {
  number: string;
  label: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
}

export interface Stats3RowProps {
  tag?: string;
  title: string;
  subtitle?: string;
  stats: StatItem[];
}

/**
 * Layout de métricas destacadas con 3 números de gran impacto en una fila.
 */
export function Stats3Row({
  tag,
  title,
  subtitle,
  stats = [],
}: Stats3RowProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid columns={3} gap="2rem">
        {stats.slice(0, 3).map((item, index) => (
          <SlideCard
            key={`stat-${item.label || index}`}
            variant="elevated"
            className="p-8 text-center justify-center items-center h-full"
          >
            <div className="text-6xl font-black mb-3 tracking-tight">
              {item.number}
            </div>
            <div className="text-xl font-bold mb-2">{item.label}</div>
            {item.change && (
              <div className="mb-3">
                <SlideBadge
                  variant={
                    item.changeType === 'positive'
                      ? 'success'
                      : item.changeType === 'negative'
                        ? 'error'
                        : 'secondary'
                  }
                  className="text-xs font-semibold"
                >
                  {item.change}
                </SlideBadge>
              </div>
            )}
            {item.description && (
              <p className="text-sm opacity-70 max-w-xs mx-auto">
                {item.description}
              </p>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

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
  /** Lavado claro/oscuro */
  tone?: 'light' | 'dark';
}

/**
 * Layout de métricas destacadas con 3 números de gran impacto en una fila.
 */
export function Stats3Row({
  tag,
  title,
  subtitle,
  stats = [],
  tone = 'light',
}: Stats3RowProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle} tone={tone}>
      <SlideGrid columns={3} gap="1.5rem" className="flex-1 min-h-0">
        {stats.slice(0, 3).map((item, index) => (
          <SlideCard
            key={`stat-${item.label || index}`}
            variant="elevated"
            className="p-6 text-center justify-center items-center min-w-0 min-h-0 overflow-hidden"
          >
            <div className="text-5xl font-black mb-2 tracking-tight tabular-nums truncate max-w-full">
              {item.number}
            </div>
            <div className="text-lg font-bold mb-2 line-clamp-2 break-words min-w-0 max-w-full">
              {item.label}
            </div>
            {item.change && (
              <div className="mb-2 shrink-0">
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
              <p className="text-sm opacity-70 max-w-full mx-auto line-clamp-2 break-words min-w-0">
                {item.description}
              </p>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

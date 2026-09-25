import { SlideCard } from '../../primitives/SlideCard';
import { SlideGrid } from '../../primitives/SlideGrid';
import { SlideSection } from '../../primitives/SlideSection';

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
      <SlideGrid cols={3} gap="2rem">
        {stats.slice(0, 3).map((item, index) => (
          <SlideCard
            key={index}
            variant="elevated"
            className="p-8 text-center justify-center items-center h-full"
          >
            <div className="text-6xl font-black text-[var(--slide-accent-secondary,#D4AF37)] mb-3 tracking-tight">
              {item.number}
            </div>
            <div className="text-xl font-bold text-[var(--slide-text,#f1f5f9)] mb-2">
              {item.label}
            </div>
            {item.change && (
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-3 ${
                  item.changeType === 'positive'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : item.changeType === 'negative'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-white/10 text-white/70'
                }`}
              >
                {item.change}
              </span>
            )}
            {item.description && (
              <p className="text-sm text-[var(--slide-text-muted,#94a3b8)] max-w-xs mx-auto">
                {item.description}
              </p>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

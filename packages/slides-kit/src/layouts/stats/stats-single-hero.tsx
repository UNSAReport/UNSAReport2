import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface StatsSingleHeroProps {
  tag?: string;
  metric: string;
  label: string;
  subtitle?: string;
  contextNote?: string;
  badge?: string;
}

/**
 * Métrica individual monumental para enfatizar el hallazgo cuantitativo central de la investigación.
 */
export function StatsSingleHero({
  tag = 'Hallazgo Cuantitativo Principal',
  metric,
  label,
  subtitle,
  contextNote,
  badge,
}: StatsSingleHeroProps) {
  return (
    <SlideSection tag={tag}>
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto p-8">
        {badge && (
          <div className="mb-4">
            <SlideBadge variant="accent">{badge}</SlideBadge>
          </div>
        )}

        <div className="text-8xl md:text-9xl font-black tracking-tight leading-none mb-4">
          {metric}
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
          {label}
        </h2>

        {subtitle && (
          <p className="text-xl opacity-80 max-w-2xl mb-8 leading-relaxed">
            {subtitle}
          </p>
        )}

        {contextNote && (
          <SlideCard variant="muted" className="p-4 max-w-lg w-full">
            <p className="text-xs opacity-75 font-mono">{contextNote}</p>
          </SlideCard>
        )}
      </div>
    </SlideSection>
  );
}

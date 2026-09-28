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
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center text-center max-w-4xl mx-auto gap-4 p-6">
        {badge && (
          <div className="shrink-0">
            <SlideBadge variant="accent">{badge}</SlideBadge>
          </div>
        )}

        <div className="text-8xl md:text-9xl font-black tracking-tight leading-none line-clamp-2 break-words min-w-0 max-w-full">
          {metric}
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight line-clamp-2 break-words min-w-0 max-w-full">
          {label}
        </h2>

        {subtitle && (
          <p className="text-xl opacity-80 max-w-2xl leading-relaxed line-clamp-3 break-words min-w-0">
            {subtitle}
          </p>
        )}

        {contextNote && (
          <SlideCard
            variant="muted"
            className="p-4 max-w-lg w-full min-w-0 shrink-0 overflow-hidden"
          >
            <p className="text-xs opacity-75 font-mono line-clamp-3 break-words">
              {contextNote}
            </p>
          </SlideCard>
        )}
      </div>
    </SlideSection>
  );
}

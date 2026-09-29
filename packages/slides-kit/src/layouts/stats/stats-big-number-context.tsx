import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface StatsBigNumberContextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  metric: string;
  metricLabel: string;
  badge?: string;
  contextTitle: string;
  contextParagraphs: string[];
}

/**
 * Gran número de impacto en la columna izquierda y contexto analítico en la derecha.
 */
export function StatsBigNumberContext({
  tag = 'Impacto Principal',
  title,
  subtitle,
  metric,
  metricLabel,
  badge,
  contextTitle,
  contextParagraphs = [],
}: StatsBigNumberContextProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="40-60"
        gap="1.5rem"
        className="flex-1 min-h-0 items-stretch"
        left={
          <SlideCard
            variant="glow"
            className="min-h-0 items-center justify-center text-center p-6 min-w-0 overflow-hidden"
          >
            {badge && (
              <div className="mb-3 shrink-0">
                <SlideBadge variant="accent">{badge}</SlideBadge>
              </div>
            )}
            <div className="text-6xl font-black font-mono tracking-tight leading-none mb-3 tabular-nums truncate max-w-full">
              {metric}
            </div>
            <span className="text-sm uppercase font-mono tracking-wider opacity-75 font-semibold line-clamp-2 break-words min-w-0 max-w-full">
              {metricLabel}
            </span>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="default"
            className="min-h-0 justify-center p-6 min-w-0 overflow-hidden"
          >
            <h3 className="text-2xl font-bold mb-2 line-clamp-2 break-words min-w-0">
              {contextTitle}
            </h3>
            <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
              {contextParagraphs.slice(0, 3).map((p) => (
                <p
                  key={`ctx-p-${p}`}
                  className="text-base opacity-85 leading-relaxed line-clamp-3 break-words min-w-0"
                >
                  {p}
                </p>
              ))}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

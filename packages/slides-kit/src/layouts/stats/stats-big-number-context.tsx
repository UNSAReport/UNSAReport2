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
        gap="2.5rem"
        left={
          <SlideCard
            variant="glow"
            className="h-full items-center justify-center text-center p-8"
          >
            {badge && (
              <div className="mb-4">
                <SlideBadge variant="accent">{badge}</SlideBadge>
              </div>
            )}
            <div className="text-7xl md:text-8xl font-black font-mono tracking-tight leading-none mb-3">
              {metric}
            </div>
            <span className="text-base uppercase font-mono tracking-wider opacity-75 font-semibold">
              {metricLabel}
            </span>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="default"
            className="h-full justify-center p-8 space-y-4"
          >
            <h3 className="text-2xl font-bold mb-2">{contextTitle}</h3>
            {contextParagraphs.map((p) => (
              <p
                key={`ctx-p-${p}`}
                className="text-base opacity-85 leading-relaxed"
              >
                {p}
              </p>
            ))}
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

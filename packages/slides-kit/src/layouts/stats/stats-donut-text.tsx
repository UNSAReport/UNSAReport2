import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDonut } from '@/primitives/SlideDonut';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface DonutSegment {
  label: string;
  percentage: string;
  detail: string;
}

export interface StatsDonutTextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  mainPercentage: string;
  mainLabel: string;
  segments: DonutSegment[];
}

/**
 * Métrica circular central con desglose analítico en lista detallada a la derecha.
 */
export function StatsDonutText({
  tag = 'Distribución Proporcional',
  title,
  subtitle,
  mainPercentage,
  mainLabel,
  segments = [],
}: StatsDonutTextProps) {
  return (
    <SlideSection
      tag={tag}
      title={title}
      subtitle={subtitle}
      className="w-full h-full overflow-hidden"
    >
      <div className="w-full h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <SlideSplit
          ratio="40-60"
          gap="2.5rem"
          left={
            <SlideCard
              variant="glow"
              className="h-full min-h-0 min-w-0 items-center justify-center text-center p-8 overflow-hidden"
            >
              <div className="flex-1 min-h-0 max-h-full overflow-hidden flex items-center justify-center w-full">
                <SlideDonut
                  value={Number.parseFloat(mainPercentage) || 0}
                  max={100}
                  tone="accent"
                  size="10rem"
                  thickness="8px"
                  label={mainPercentage}
                  sublabel={mainLabel}
                />
              </div>
            </SlideCard>
          }
          right={
            <div className="flex flex-col justify-center h-full min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
              {segments.map((seg, idx) => (
                <SlideCard
                  key={`seg-${seg.label || idx}`}
                  variant="default"
                  className="p-4 flex-row items-center justify-between gap-4 min-w-0 shrink-0 overflow-hidden"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold truncate min-w-0">
                      {seg.label}
                    </h4>
                    <p className="text-xs opacity-75 line-clamp-2 break-words min-w-0">
                      {seg.detail}
                    </p>
                  </div>
                  <SlideBadge
                    variant="secondary"
                    className="font-mono font-bold text-sm shrink-0"
                  >
                    {seg.percentage}
                  </SlideBadge>
                </SlideCard>
              ))}
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

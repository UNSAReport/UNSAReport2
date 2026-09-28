import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface DashboardMetric {
  label: string;
  value: string;
}

export interface BentoDashboardProps {
  tag?: string;
  title: string;
  subtitle?: string;
  metrics: DashboardMetric[];
  chartTitle: string;
  chartContent: ReactNode;
  activityTitle: string;
  activities: string[];
}

/**
 * Panel de control integral estilo Dashboard con KPIs superiores, gráfico central y actividad lateral.
 */
export function BentoDashboard({
  tag = 'Panel de Control',
  title,
  subtitle,
  metrics = [],
  chartTitle,
  chartContent,
  activityTitle = 'Actividad Reciente',
  activities = [],
}: BentoDashboardProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {/* Top 4 KPI Metrics */}
        <SlideGrid cols={4} gap="1rem" className="h-auto shrink-0">
          {metrics.slice(0, 4).map((m, idx) => (
            <SlideCard
              key={`dash-kpi-${m.label || idx}`}
              variant="default"
              className="min-h-0 min-w-0 overflow-hidden p-3 text-center"
            >
              <span className="block truncate text-[10px] uppercase font-mono opacity-60">
                {m.label}
              </span>
              <span className="mt-0.5 block truncate text-xl font-black font-mono">
                {m.value}
              </span>
            </SlideCard>
          ))}
        </SlideGrid>

        {/* Main Chart + Side Widget */}
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <SlideSplit
            ratio="70-30"
            gap="1rem"
            className="min-h-0"
            left={
              <SlideCard
                variant="elevated"
                className="h-full min-h-0 min-w-0 justify-between overflow-hidden p-6"
              >
                <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 border-b border-current/10 pb-2 mb-2">
                  <h4 className="min-w-0 truncate text-sm font-bold font-mono">
                    {chartTitle}
                  </h4>
                  <SlideBadge
                    variant="secondary"
                    className="shrink-0 text-[10px]"
                  >
                    Gráfico en Tiempo Real
                  </SlideBadge>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-2">
                  <div className="min-h-0 min-w-0 max-h-full max-w-full overflow-hidden [&>*]:max-h-full [&>*]:max-w-full">
                    {chartContent}
                  </div>
                </div>
              </SlideCard>
            }
            right={
              <SlideCard
                variant="default"
                className="h-full min-h-0 min-w-0 justify-start overflow-hidden p-5"
              >
                <h4 className="mb-3 shrink-0 truncate border-b border-current/10 pb-2 text-xs uppercase font-mono font-bold">
                  {activityTitle}
                </h4>
                <ul className="min-h-0 min-w-0 flex-1 space-y-2 overflow-hidden">
                  {activities.slice(0, 6).map((act) => (
                    <li
                      key={`act-${act}`}
                      className="break-words border-b border-current/5 pb-1 text-xs opacity-75 line-clamp-2"
                    >
                      {act}
                    </li>
                  ))}
                </ul>
              </SlideCard>
            }
          />
        </div>
      </div>
    </SlideSection>
  );
}

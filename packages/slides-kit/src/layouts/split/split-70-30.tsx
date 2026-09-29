import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface Split7030Props {
  tag?: string;
  title: string;
  subtitle?: string;
  mainTitle?: string;
  mainContent: ReactNode;
  sidebarBadge?: string;
  sidebarTitle: string;
  sidebarStats?: Array<{ label: string; value: string }>;
}

/**
 * Área principal dominante (70%) a la izquierda y barra lateral de métricas o notas (30%) a la derecha.
 */
export function Split7030({
  tag,
  title,
  subtitle,
  mainTitle,
  mainContent,
  sidebarBadge,
  sidebarTitle,
  sidebarStats = [],
}: Split7030Props) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="70-30"
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0"
        left={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-start p-8"
          >
            {mainTitle && (
              <h3 className="text-2xl font-bold mb-4 line-clamp-2 break-words">
                {mainTitle}
              </h3>
            )}
            <div className="text-base leading-relaxed opacity-90 min-w-0 min-h-0 overflow-hidden break-words line-clamp-[12]">
              {mainContent}
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="glow"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-6"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              {sidebarBadge && (
                <div className="mb-4">
                  <SlideBadge variant="accent">{sidebarBadge}</SlideBadge>
                </div>
              )}
              <h3 className="text-xl font-bold mb-6 line-clamp-2 break-words">
                {sidebarTitle}
              </h3>
              <div className="space-y-4 overflow-hidden">
                {sidebarStats.slice(0, 4).map((st) => (
                  <div
                    key={`side-stat-${st.label}`}
                    className="border-b border-current/10 pb-3 min-w-0"
                  >
                    <span className="text-xs uppercase font-mono opacity-60 block truncate">
                      {st.label}
                    </span>
                    <span className="text-2xl font-bold font-mono truncate block">
                      {st.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

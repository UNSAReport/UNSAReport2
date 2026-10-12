import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface BentoSidebarMainProps {
  tag?: string;
  title: string;
  subtitle?: string;
  sidebarTitle: string;
  sidebarBadge?: string;
  sidebarContent: ReactNode;
  mainTopTitle: string;
  mainTopContent: ReactNode;
  mainBottomLeftTitle: string;
  mainBottomLeftContent: ReactNode;
  mainBottomRightTitle: string;
  mainBottomRightContent: ReactNode;
}

/**
 * Columna lateral izquierda continua (30%) y matriz modular principal de 3 tarjetas a la derecha (70%).
 */
export function BentoSidebarMain({
  tag,
  title,
  subtitle,
  sidebarTitle,
  sidebarBadge,
  sidebarContent,
  mainTopTitle,
  mainTopContent,
  mainBottomLeftTitle,
  mainBottomLeftContent,
  mainBottomRightTitle,
  mainBottomRightContent,
}: BentoSidebarMainProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden">
        <SlideSplit
          ratio="30-70"
          gap="1rem"
          className="min-h-0"
          left={
            <SlideCard
              variant="default"
              className="h-full min-h-0 min-w-0 justify-between overflow-hidden p-6"
            >
              <div className="min-w-0">
                <div className="flex justify-between items-center gap-2 mb-4 border-b border-current/10 pb-2">
                  <h3 className="text-lg font-bold min-w-0 line-clamp-2 break-words">
                    {sidebarTitle}
                  </h3>
                  {sidebarBadge && (
                    <SlideBadge
                      variant="secondary"
                      className="text-xs shrink-0"
                    >
                      {sidebarBadge}
                    </SlideBadge>
                  )}
                </div>
                <div className="text-xs opacity-80 leading-relaxed break-words overflow-hidden line-clamp-6">
                  {sidebarContent}
                </div>
              </div>
            </SlideCard>
          }
          right={
            <div className="h-full min-h-0 min-w-0 flex flex-col gap-4 overflow-hidden">
              <SlideCard
                variant="glow"
                className="flex-1 min-h-0 min-w-0 p-6 justify-between overflow-hidden"
              >
                <div className="min-w-0">
                  <h4 className="text-xl font-bold mb-2 min-w-0 line-clamp-2 break-words">
                    {mainTopTitle}
                  </h4>
                  <div className="text-sm opacity-85 leading-relaxed break-words overflow-hidden line-clamp-4">
                    {mainTopContent}
                  </div>
                </div>
              </SlideCard>
              <SlideGrid cols={2} gap="1rem" className="flex-1 min-h-0 h-full">
                <SlideCard
                  variant="default"
                  className="min-h-0 min-w-0 p-4 justify-between h-full overflow-hidden"
                >
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold mb-1 truncate">
                      {mainBottomLeftTitle}
                    </h5>
                    <div className="text-xs opacity-75 break-words overflow-hidden line-clamp-3">
                      {mainBottomLeftContent}
                    </div>
                  </div>
                </SlideCard>
                <SlideCard
                  variant="default"
                  className="min-h-0 min-w-0 p-4 justify-between h-full overflow-hidden"
                >
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold mb-1 truncate">
                      {mainBottomRightTitle}
                    </h5>
                    <div className="text-xs opacity-75 break-words overflow-hidden line-clamp-3">
                      {mainBottomRightContent}
                    </div>
                  </div>
                </SlideCard>
              </SlideGrid>
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

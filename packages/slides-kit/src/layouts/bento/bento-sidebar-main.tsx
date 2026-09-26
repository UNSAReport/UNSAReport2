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
      <SlideSplit
        ratio="30-70"
        gap="1.5rem"
        left={
          <SlideCard variant="default" className="h-full justify-between p-6">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-current/10 pb-2">
                <h3 className="text-lg font-bold">{sidebarTitle}</h3>
                {sidebarBadge && (
                  <SlideBadge variant="secondary" className="text-xs">
                    {sidebarBadge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed">
                {sidebarContent}
              </div>
            </div>
          </SlideCard>
        }
        right={
          <div className="h-full flex flex-col gap-4">
            <SlideCard variant="glow" className="flex-1 p-6 justify-between">
              <h4 className="text-xl font-bold mb-2">{mainTopTitle}</h4>
              <div className="text-sm opacity-85 leading-relaxed">
                {mainTopContent}
              </div>
            </SlideCard>
            <SlideGrid cols={2} gap="1rem" className="flex-1">
              <SlideCard
                variant="default"
                className="p-4 justify-between h-full"
              >
                <h5 className="text-sm font-bold mb-1">
                  {mainBottomLeftTitle}
                </h5>
                <div className="text-xs opacity-75">
                  {mainBottomLeftContent}
                </div>
              </SlideCard>
              <SlideCard
                variant="default"
                className="p-4 justify-between h-full"
              >
                <h5 className="text-sm font-bold mb-1">
                  {mainBottomRightTitle}
                </h5>
                <div className="text-xs opacity-75">
                  {mainBottomRightContent}
                </div>
              </SlideCard>
            </SlideGrid>
          </div>
        }
      />
    </SlideSection>
  );
}

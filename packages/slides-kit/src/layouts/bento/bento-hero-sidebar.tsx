import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SidebarWidget {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface BentoHeroSidebarProps {
  tag?: string;
  title: string;
  subtitle?: string;
  heroTitle: string;
  heroContent: ReactNode;
  heroBadge?: string;
  sidebarTop: SidebarWidget;
  sidebarBottom: SidebarWidget;
}

/**
 * Tarjeta monumental a la izquierda (70%) y dos tarjetas widget apiladas en la barra lateral derecha (30%).
 */
export function BentoHeroSidebar({
  tag,
  title,
  subtitle,
  heroTitle,
  heroContent,
  heroBadge,
  sidebarTop,
  sidebarBottom,
}: BentoHeroSidebarProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="70-30"
        gap="2rem"
        left={
          <SlideCard variant="glow" className="h-full justify-between p-8">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-3xl font-extrabold">{heroTitle}</h3>
                {heroBadge && (
                  <SlideBadge variant="accent">{heroBadge}</SlideBadge>
                )}
              </div>
              <div className="text-base opacity-85 leading-relaxed">
                {heroContent}
              </div>
            </div>
          </SlideCard>
        }
        right={
          <div className="h-full flex flex-col gap-4">
            <SlideCard variant="default" className="flex-1 p-5 justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold">{sidebarTop.title}</h4>
                  {sidebarTop.badge && (
                    <SlideBadge variant="secondary" className="text-[10px]">
                      {sidebarTop.badge}
                    </SlideBadge>
                  )}
                </div>
                <div className="text-xs opacity-75">{sidebarTop.content}</div>
              </div>
            </SlideCard>
            <SlideCard variant="default" className="flex-1 p-5 justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold">{sidebarBottom.title}</h4>
                  {sidebarBottom.badge && (
                    <SlideBadge variant="secondary" className="text-[10px]">
                      {sidebarBottom.badge}
                    </SlideBadge>
                  )}
                </div>
                <div className="text-xs opacity-75">
                  {sidebarBottom.content}
                </div>
              </div>
            </SlideCard>
          </div>
        }
      />
    </SlideSection>
  );
}

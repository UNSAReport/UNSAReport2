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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <SlideSplit
          ratio="70-30"
          gap="1rem"
          className="min-h-0 flex-1"
          left={
            <SlideCard
              variant="glow"
              className="h-full min-h-0 min-w-0 justify-between overflow-hidden p-8"
            >
              <div className="min-h-0 min-w-0 overflow-hidden">
                <div className="mb-4 flex min-w-0 items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words text-3xl font-extrabold line-clamp-2">
                    {heroTitle}
                  </h3>
                  {heroBadge && (
                    <SlideBadge variant="accent" className="shrink-0">
                      {heroBadge}
                    </SlideBadge>
                  )}
                </div>
                <div className="break-words text-base opacity-85 leading-relaxed line-clamp-6">
                  {heroContent}
                </div>
              </div>
            </SlideCard>
          }
          right={
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
              <SlideCard
                variant="default"
                className="min-h-0 min-w-0 flex-1 justify-between overflow-hidden p-5"
              >
                <div className="min-h-0 min-w-0 overflow-hidden">
                  <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                    <h4 className="min-w-0 truncate text-sm font-bold">
                      {sidebarTop.title}
                    </h4>
                    {sidebarTop.badge && (
                      <SlideBadge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        {sidebarTop.badge}
                      </SlideBadge>
                    )}
                  </div>
                  <div className="break-words text-xs opacity-75 line-clamp-6">
                    {sidebarTop.content}
                  </div>
                </div>
              </SlideCard>
              <SlideCard
                variant="default"
                className="min-h-0 min-w-0 flex-1 justify-between overflow-hidden p-5"
              >
                <div className="min-h-0 min-w-0 overflow-hidden">
                  <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                    <h4 className="min-w-0 truncate text-sm font-bold">
                      {sidebarBottom.title}
                    </h4>
                    {sidebarBottom.badge && (
                      <SlideBadge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        {sidebarBottom.badge}
                      </SlideBadge>
                    )}
                  </div>
                  <div className="break-words text-xs opacity-75 line-clamp-6">
                    {sidebarBottom.content}
                  </div>
                </div>
              </SlideCard>
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

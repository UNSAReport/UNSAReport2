import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface BottomCardItem {
  title: string;
  description: string;
  badge?: string;
}

export interface Bento4FeaturedTopProps {
  tag?: string;
  title: string;
  subtitle?: string;
  featuredTitle: string;
  featuredContent: ReactNode;
  featuredBadge?: string;
  bottomCards: BottomCardItem[];
}

/**
 * Tarjeta ancha dominante superior y fila inferior de 3 tarjetas compactas.
 */
export function Bento4FeaturedTop({
  tag,
  title,
  subtitle,
  featuredTitle,
  featuredContent,
  featuredBadge,
  bottomCards = [],
}: Bento4FeaturedTopProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-6 my-auto">
        {/* Top Featured Card */}
        <SlideCard variant="glow" className="p-8 flex-1 justify-between">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-bold">{featuredTitle}</h3>
            {featuredBadge && (
              <SlideBadge variant="accent">{featuredBadge}</SlideBadge>
            )}
          </div>
          <div className="text-base opacity-85 leading-relaxed">
            {featuredContent}
          </div>
        </SlideCard>

        {/* Bottom 3 Cards */}
        <SlideGrid cols={3} gap="1.5rem" className="flex-1">
          {bottomCards.slice(0, 3).map((c, idx) => (
            <SlideCard
              key={`top-bot-${c.title || idx}`}
              variant="default"
              className="p-6 justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-bold">{c.title}</h4>
                  {c.badge && (
                    <SlideBadge variant="secondary" className="text-[10px]">
                      {c.badge}
                    </SlideBadge>
                  )}
                </div>
                <p className="text-xs opacity-75 leading-relaxed">
                  {c.description}
                </p>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

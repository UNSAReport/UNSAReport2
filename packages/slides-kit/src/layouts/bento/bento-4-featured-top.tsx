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
      <div className="flex flex-col w-full flex-1 min-h-0 gap-6 overflow-hidden">
        {/* Top Featured Card */}
        <SlideCard
          variant="glow"
          className="p-8 flex-1 min-h-0 min-w-0 justify-between overflow-hidden"
        >
          <div className="flex justify-between items-start gap-4 mb-3 min-w-0">
            <h3 className="text-2xl font-bold line-clamp-2 break-words min-w-0">
              {featuredTitle}
            </h3>
            {featuredBadge && (
              <SlideBadge variant="accent" className="shrink-0">
                {featuredBadge}
              </SlideBadge>
            )}
          </div>
          <div className="text-base opacity-85 leading-relaxed line-clamp-4 break-words min-w-0 overflow-hidden">
            {featuredContent}
          </div>
        </SlideCard>

        {/* Bottom 3 Cards */}
        <SlideGrid cols={3} gap="1.5rem" className="flex-1 min-h-0">
          {bottomCards.slice(0, 3).map((c, idx) => (
            <SlideCard
              key={`top-bot-${c.title || idx}`}
              variant="default"
              className="p-6 justify-between min-h-0 min-w-0 h-full overflow-hidden"
            >
              <div className="min-w-0 overflow-hidden">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <h4 className="text-base font-bold line-clamp-2 break-words min-w-0">
                    {c.title}
                  </h4>
                  {c.badge && (
                    <SlideBadge
                      variant="secondary"
                      className="text-[10px] shrink-0"
                    >
                      {c.badge}
                    </SlideBadge>
                  )}
                </div>
                <p className="text-xs opacity-75 leading-relaxed line-clamp-4 break-words">
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

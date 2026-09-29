import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface BentoCardItem {
  title: string;
  stat?: string;
  description?: string;
  badge?: string;
  status?: 'optimal' | 'normal' | 'warning';
}

export interface Bento4FeaturedLeftProps {
  tag?: string;
  title: string;
  subtitle?: string;
  featured: {
    stat?: string;
    label?: string;
    description?: string;
    badge?: string;
    content?: ReactNode;
  };
  cards: BentoCardItem[];
}

/**
 * Layout estilo Bento Grid con tarjeta destacada grande a la izquierda y cuadrícula 3-card a la derecha.
 */
export function Bento4FeaturedLeft({
  tag,
  title,
  subtitle,
  featured,
  cards = [],
}: Bento4FeaturedLeftProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="grid grid-cols-12 gap-6 w-full flex-1 min-h-0 overflow-hidden items-stretch">
        {/* Featured Left Card (5 cols) */}
        <div className="col-span-5 min-h-0 min-w-0 flex">
          <SlideCard
            variant="glow"
            featured={true}
            className="flex-1 min-h-0 min-w-0 justify-between p-8 overflow-hidden"
          >
            <div className="min-w-0 overflow-hidden">
              {featured.badge && (
                <div className="mb-4">
                  <SlideBadge variant="secondary">{featured.badge}</SlideBadge>
                </div>
              )}
              {featured.stat && (
                <div className="text-5xl font-black mb-2 tracking-tight truncate">
                  {featured.stat}
                </div>
              )}
              {featured.label && (
                <h3 className="text-2xl font-bold mb-3 line-clamp-2 break-words">
                  {featured.label}
                </h3>
              )}
              {featured.description && (
                <p className="text-base opacity-80 leading-relaxed line-clamp-4 break-words">
                  {featured.description}
                </p>
              )}
            </div>
            {featured.content && (
              <div className="mt-4 min-w-0 overflow-hidden">
                {featured.content}
              </div>
            )}
          </SlideCard>
        </div>

        {/* Right 3 Cards (7 cols: 1 top wide, 2 bottom) */}
        <div className="col-span-7 min-h-0 min-w-0 flex flex-col gap-6 overflow-hidden">
          {cards[0] && (
            <SlideCard className="flex-1 min-h-0 min-w-0 justify-between p-6 overflow-hidden">
              <div className="min-w-0 overflow-hidden">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="text-lg font-semibold line-clamp-2 break-words min-w-0">
                    {cards[0].title}
                  </h4>
                  {cards[0].badge && (
                    <SlideBadge variant="accent" className="shrink-0">
                      {cards[0].badge}
                    </SlideBadge>
                  )}
                </div>
                {cards[0].stat && (
                  <div className="text-3xl font-extrabold mb-1 truncate">
                    {cards[0].stat}
                  </div>
                )}
                {cards[0].description && (
                  <p className="text-sm opacity-70 line-clamp-3 break-words">
                    {cards[0].description}
                  </p>
                )}
              </div>
            </SlideCard>
          )}

          <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
            {cards.slice(1, 3).map((card, idx) => (
              <SlideCard
                key={`bento-card-${card.title || idx}`}
                className="min-h-0 min-w-0 h-full justify-between p-6 overflow-hidden"
              >
                <div className="min-w-0 overflow-hidden">
                  <h4 className="text-base font-semibold mb-1 line-clamp-2 break-words">
                    {card.title}
                  </h4>
                  {card.stat && (
                    <div className="text-2xl font-bold mb-1 truncate">
                      {card.stat}
                    </div>
                  )}
                  {card.description && (
                    <p className="text-xs opacity-60 line-clamp-3 break-words">
                      {card.description}
                    </p>
                  )}
                </div>
              </SlideCard>
            ))}
          </div>
        </div>
      </div>
    </SlideSection>
  );
}

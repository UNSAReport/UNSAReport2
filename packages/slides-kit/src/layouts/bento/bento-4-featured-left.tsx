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
      <div className="grid grid-cols-12 gap-6 w-full h-full items-stretch">
        {/* Featured Left Card (5 cols) */}
        <div className="col-span-5 h-full">
          <SlideCard
            variant="glow"
            featured={true}
            className="h-full justify-between p-8"
          >
            <div>
              {featured.badge && (
                <div className="mb-4">
                  <SlideBadge variant="secondary">{featured.badge}</SlideBadge>
                </div>
              )}
              {featured.stat && (
                <div className="text-6xl font-black mb-2 tracking-tight">
                  {featured.stat}
                </div>
              )}
              {featured.label && (
                <h3 className="text-2xl font-bold mb-3">{featured.label}</h3>
              )}
              {featured.description && (
                <p className="text-base opacity-80 leading-relaxed">
                  {featured.description}
                </p>
              )}
            </div>
            {featured.content && <div className="mt-4">{featured.content}</div>}
          </SlideCard>
        </div>

        {/* Right 3 Cards (7 cols: 1 top wide, 2 bottom) */}
        <div className="col-span-7 h-full flex flex-col gap-6">
          {cards[0] && (
            <SlideCard className="flex-1 justify-between p-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-semibold">{cards[0].title}</h4>
                {cards[0].badge && (
                  <SlideBadge variant="accent">{cards[0].badge}</SlideBadge>
                )}
              </div>
              {cards[0].stat && (
                <div className="text-3xl font-extrabold mb-1">
                  {cards[0].stat}
                </div>
              )}
              {cards[0].description && (
                <p className="text-sm opacity-70">{cards[0].description}</p>
              )}
            </SlideCard>
          )}

          <div className="flex-1 grid grid-cols-2 gap-6">
            {cards.slice(1, 3).map((card, idx) => (
              <SlideCard
                key={`bento-card-${card.title || idx}`}
                className="h-full justify-between p-6"
              >
                <div>
                  <h4 className="text-base font-semibold mb-1">{card.title}</h4>
                  {card.stat && (
                    <div className="text-2xl font-bold mb-1">{card.stat}</div>
                  )}
                  {card.description && (
                    <p className="text-xs opacity-60">{card.description}</p>
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

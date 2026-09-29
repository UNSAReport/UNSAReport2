import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface MosaicCard {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface Bento5MosaicProps {
  tag?: string;
  title: string;
  subtitle?: string;
  largeCard: MosaicCard;
  smallCards: MosaicCard[]; // 2 cards
  bottomCards: MosaicCard[]; // 2 cards
}

/**
 * Mosaico asimétrico de 5 tarjetas (1 destacada, 2 medianas y 2 inferiores).
 */
export function Bento5Mosaic({
  tag,
  title,
  subtitle,
  largeCard,
  smallCards = [],
  bottomCards = [],
}: Bento5MosaicProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="grid grid-cols-12 grid-rows-2 gap-4 w-full flex-1 min-h-0 overflow-hidden items-stretch">
        {/* Large Top-Left Card (8 cols) */}
        <div className="col-span-8 min-h-0 min-w-0 flex">
          <SlideCard
            variant="glow"
            className="p-6 flex-1 min-h-0 min-w-0 justify-between overflow-hidden"
          >
            <div className="min-w-0 overflow-hidden">
              <div className="flex justify-between items-center gap-2 mb-2">
                <h3 className="text-xl font-bold line-clamp-2 break-words min-w-0">
                  {largeCard.title}
                </h3>
                {largeCard.badge && (
                  <SlideBadge variant="accent" className="shrink-0">
                    {largeCard.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 line-clamp-4 break-words overflow-hidden">
                {largeCard.content}
              </div>
            </div>
          </SlideCard>
        </div>

        {/* 2 Small Cards Top-Right (4 cols) */}
        <div className="col-span-4 row-span-1 min-h-0 min-w-0 flex flex-col gap-4 overflow-hidden">
          {smallCards.slice(0, 2).map((sc, idx) => (
            <SlideCard
              key={`mos-sm-${sc.title || idx}`}
              variant="default"
              className="p-4 flex-1 min-h-0 min-w-0 justify-between overflow-hidden"
            >
              <h4 className="text-sm font-bold mb-1 line-clamp-2 break-words min-w-0">
                {sc.title}
              </h4>
              <div className="text-xs opacity-75 line-clamp-3 break-words overflow-hidden">
                {sc.content}
              </div>
            </SlideCard>
          ))}
        </div>

        {/* 2 Bottom Cards (6 cols each) */}
        {bottomCards.slice(0, 2).map((bc, idx) => (
          <div
            key={`mos-bot-${bc.title || idx}`}
            className="col-span-6 min-h-0 min-w-0 flex"
          >
            <SlideCard
              variant="default"
              className="p-4 flex-1 min-h-0 min-w-0 h-full justify-between overflow-hidden"
            >
              <div className="flex justify-between items-center gap-2 mb-1 min-w-0">
                <h4 className="text-base font-bold line-clamp-2 break-words min-w-0">
                  {bc.title}
                </h4>
                {bc.badge && (
                  <SlideBadge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                  >
                    {bc.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 line-clamp-3 break-words overflow-hidden">
                {bc.content}
              </div>
            </SlideCard>
          </div>
        ))}
      </div>
    </SlideSection>
  );
}

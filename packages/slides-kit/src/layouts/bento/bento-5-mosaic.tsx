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
      <div className="grid grid-cols-12 gap-4 h-full my-auto">
        {/* Large Top-Left Card (8 cols) */}
        <div className="col-span-8">
          <SlideCard variant="glow" className="p-6 h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">{largeCard.title}</h3>
                {largeCard.badge && (
                  <SlideBadge variant="accent">{largeCard.badge}</SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85">{largeCard.content}</div>
            </div>
          </SlideCard>
        </div>

        {/* 2 Small Cards Top-Right (4 cols) */}
        <div className="col-span-4 flex flex-col gap-4">
          {smallCards.slice(0, 2).map((sc, idx) => (
            <SlideCard
              key={`mos-sm-${sc.title || idx}`}
              variant="default"
              className="p-4 flex-1 justify-between"
            >
              <h4 className="text-sm font-bold mb-1">{sc.title}</h4>
              <div className="text-xs opacity-75">{sc.content}</div>
            </SlideCard>
          ))}
        </div>

        {/* 2 Bottom Cards (6 cols each) */}
        {bottomCards.slice(0, 2).map((bc, idx) => (
          <div key={`mos-bot-${bc.title || idx}`} className="col-span-6">
            <SlideCard variant="default" className="p-4 h-full justify-between">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-base font-bold">{bc.title}</h4>
                {bc.badge && (
                  <SlideBadge variant="secondary" className="text-[10px]">
                    {bc.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80">{bc.content}</div>
            </SlideCard>
          </div>
        ))}
      </div>
    </SlideSection>
  );
}

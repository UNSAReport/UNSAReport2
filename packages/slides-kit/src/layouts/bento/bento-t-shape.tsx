import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface TShapeItem {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface BentoTShapeProps {
  tag?: string;
  title: string;
  subtitle?: string;
  headerCard: TShapeItem;
  stemCard: TShapeItem;
  flankLeft: TShapeItem;
  flankRight: TShapeItem;
}

/**
 * Disposición Bento en forma de T con barra horizontal superior y tallo central flanqueado.
 */
export function BentoTShape({
  tag,
  title,
  subtitle,
  headerCard,
  stemCard,
  flankLeft,
  flankRight,
}: BentoTShapeProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-4 my-auto">
        {/* Top Header Card */}
        <SlideCard variant="glow" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">{headerCard.title}</h3>
            {headerCard.badge && (
              <SlideBadge variant="accent">{headerCard.badge}</SlideBadge>
            )}
          </div>
          <div className="text-sm opacity-85">{headerCard.content}</div>
        </SlideCard>

        {/* Bottom 3 Columns: Flank Left, Center Stem (prominent), Flank Right */}
        <SlideGrid cols={3} gap="1rem" className="flex-1">
          <SlideCard variant="default" className="p-5 justify-between h-full">
            <h4 className="text-sm font-bold mb-1">{flankLeft.title}</h4>
            <div className="text-xs opacity-75">{flankLeft.content}</div>
          </SlideCard>

          <SlideCard
            variant="elevated"
            className="p-5 justify-between h-full border-t-2 border-t-current"
          >
            <h4 className="text-base font-bold mb-1">{stemCard.title}</h4>
            <div className="text-xs opacity-85 font-medium">
              {stemCard.content}
            </div>
          </SlideCard>

          <SlideCard variant="default" className="p-5 justify-between h-full">
            <h4 className="text-sm font-bold mb-1">{flankRight.title}</h4>
            <div className="text-xs opacity-75">{flankRight.content}</div>
          </SlideCard>
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

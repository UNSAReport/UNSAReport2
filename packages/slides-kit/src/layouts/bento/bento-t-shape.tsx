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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {/* Top Header Card */}
        <SlideCard
          variant="glow"
          className="min-w-0 shrink-0 overflow-hidden p-6"
        >
          <div className="flex justify-between items-center gap-2 mb-2">
            <h3 className="text-xl font-bold min-w-0 line-clamp-2 break-words">
              {headerCard.title}
            </h3>
            {headerCard.badge && (
              <SlideBadge variant="accent" className="shrink-0">
                {headerCard.badge}
              </SlideBadge>
            )}
          </div>
          <div className="text-sm opacity-85 break-words overflow-hidden line-clamp-3">
            {headerCard.content}
          </div>
        </SlideCard>

        {/* Bottom 3 Columns: Flank Left, Center Stem (prominent), Flank Right */}
        <SlideGrid cols={3} gap="1rem" className="flex-1 min-h-0 h-full">
          <SlideCard
            variant="default"
            className="min-h-0 min-w-0 p-5 justify-between h-full overflow-hidden"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-bold mb-1 truncate">
                {flankLeft.title}
              </h4>
              <div className="text-xs opacity-75 break-words overflow-hidden line-clamp-4">
                {flankLeft.content}
              </div>
            </div>
          </SlideCard>

          <SlideCard
            variant="elevated"
            className="min-h-0 min-w-0 p-5 justify-between h-full overflow-hidden border-t-2 border-t-current"
          >
            <div className="min-w-0">
              <h4 className="text-base font-bold mb-1 line-clamp-2 break-words">
                {stemCard.title}
              </h4>
              <div className="text-xs opacity-85 font-medium break-words overflow-hidden line-clamp-4">
                {stemCard.content}
              </div>
            </div>
          </SlideCard>

          <SlideCard
            variant="default"
            className="min-h-0 min-w-0 p-5 justify-between h-full overflow-hidden"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-bold mb-1 truncate">
                {flankRight.title}
              </h4>
              <div className="text-xs opacity-75 break-words overflow-hidden line-clamp-4">
                {flankRight.content}
              </div>
            </div>
          </SlideCard>
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

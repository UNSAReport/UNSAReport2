import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface LShapeItem {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface BentoLShapeProps {
  tag?: string;
  title: string;
  subtitle?: string;
  tallLeft: LShapeItem;
  topRight: LShapeItem;
  bottomWide: LShapeItem;
}

/**
 * Disposición Bento en forma de L con tarjeta vertical izquierda, superior derecha y barra ancha inferior.
 */
export function BentoLShape({
  tag,
  title,
  subtitle,
  tallLeft,
  topRight,
  bottomWide,
}: BentoLShapeProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="grid w-full flex-1 min-h-0 min-w-0 grid-cols-12 gap-4 overflow-hidden">
        {/* Tall Left (5 cols) */}
        <div className="col-span-5 min-h-0 min-w-0 h-full overflow-hidden">
          <SlideCard
            variant="glow"
            className="h-full min-h-0 min-w-0 justify-between overflow-hidden p-6"
          >
            <div className="min-w-0">
              <div className="flex justify-between items-center gap-2 mb-3">
                <h3 className="text-xl font-bold min-w-0 line-clamp-2 break-words">
                  {tallLeft.title}
                </h3>
                {tallLeft.badge && (
                  <SlideBadge variant="accent" className="shrink-0">
                    {tallLeft.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed break-words overflow-hidden line-clamp-6">
                {tallLeft.content}
              </div>
            </div>
          </SlideCard>
        </div>

        {/* Right side (7 cols: topRight and bottomWide) */}
        <div className="col-span-7 min-h-0 min-w-0 h-full overflow-hidden flex flex-col gap-4">
          <SlideCard
            variant="default"
            className="flex-1 min-h-0 min-w-0 p-6 justify-between overflow-hidden"
          >
            <div className="min-w-0">
              <div className="flex justify-between items-center gap-2 mb-2">
                <h4 className="text-lg font-bold min-w-0 line-clamp-2 break-words">
                  {topRight.title}
                </h4>
                {topRight.badge && (
                  <SlideBadge variant="secondary" className="text-xs shrink-0">
                    {topRight.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed break-words overflow-hidden line-clamp-4">
                {topRight.content}
              </div>
            </div>
          </SlideCard>

          <SlideCard
            variant="default"
            className="flex-1 min-h-0 min-w-0 p-6 justify-between overflow-hidden"
          >
            <div className="min-w-0">
              <div className="flex justify-between items-center gap-2 mb-2">
                <h4 className="text-lg font-bold min-w-0 line-clamp-2 break-words">
                  {bottomWide.title}
                </h4>
                {bottomWide.badge && (
                  <SlideBadge variant="secondary" className="text-xs shrink-0">
                    {bottomWide.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed break-words overflow-hidden line-clamp-4">
                {bottomWide.content}
              </div>
            </div>
          </SlideCard>
        </div>
      </div>
    </SlideSection>
  );
}

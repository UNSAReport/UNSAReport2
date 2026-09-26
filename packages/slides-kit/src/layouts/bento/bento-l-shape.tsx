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
      <div className="grid grid-cols-12 gap-4 h-full my-auto">
        {/* Tall Left (5 cols) */}
        <div className="col-span-5 h-full">
          <SlideCard variant="glow" className="h-full justify-between p-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">{tallLeft.title}</h3>
                {tallLeft.badge && (
                  <SlideBadge variant="accent">{tallLeft.badge}</SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed">
                {tallLeft.content}
              </div>
            </div>
          </SlideCard>
        </div>

        {/* Right side (7 cols: topRight and bottomWide) */}
        <div className="col-span-7 h-full flex flex-col gap-4">
          <SlideCard variant="default" className="flex-1 p-6 justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold">{topRight.title}</h4>
                {topRight.badge && (
                  <SlideBadge variant="secondary" className="text-xs">
                    {topRight.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed">
                {topRight.content}
              </div>
            </div>
          </SlideCard>

          <SlideCard variant="default" className="flex-1 p-6 justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold">{bottomWide.title}</h4>
                {bottomWide.badge && (
                  <SlideBadge variant="secondary" className="text-xs">
                    {bottomWide.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed">
                {bottomWide.content}
              </div>
            </div>
          </SlideCard>
        </div>
      </div>
    </SlideSection>
  );
}

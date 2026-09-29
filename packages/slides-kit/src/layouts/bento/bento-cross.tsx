import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface BentoCrossProps {
  tag?: string;
  title: string;
  subtitle?: string;
  center: { title: string; content: ReactNode };
  top: { title: string; content: ReactNode };
  bottom: { title: string; content: ReactNode };
  left: { title: string; content: ReactNode };
  right: { title: string; content: ReactNode };
}

/**
 * Disposición Bento cruciforme con tarjeta destacada central y 4 satélites ortogonales.
 */
export function BentoCross({
  tag,
  title,
  subtitle,
  center,
  top,
  bottom,
  left,
  right,
}: BentoCrossProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 flex flex-col gap-4 overflow-hidden items-stretch">
        {/* Top Satellite */}
        <div className="w-full max-w-md mx-auto shrink-0 min-w-0">
          <SlideCard
            variant="default"
            className="p-3 text-center min-w-0 overflow-hidden"
          >
            <h4 className="text-xs font-bold line-clamp-1 break-words">
              {top.title}
            </h4>
            <div className="text-[11px] opacity-75 line-clamp-2 break-words overflow-hidden">
              {top.content}
            </div>
          </SlideCard>
        </div>

        {/* Center Row: Left, Center, Right */}
        <SlideGrid cols={3} gap="1rem" className="flex-1 min-h-0 items-stretch">
          <SlideCard
            variant="default"
            className="p-4 text-center min-h-0 min-w-0 h-full overflow-hidden"
          >
            <h4 className="text-xs font-bold line-clamp-1 break-words">
              {left.title}
            </h4>
            <div className="text-[11px] opacity-75 line-clamp-3 break-words overflow-hidden">
              {left.content}
            </div>
          </SlideCard>

          <SlideCard
            variant="glow"
            className="p-6 text-center shadow-lg min-h-0 min-w-0 h-full overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-1 line-clamp-2 break-words">
              {center.title}
            </h3>
            <div className="text-xs opacity-85 line-clamp-4 break-words overflow-hidden">
              {center.content}
            </div>
          </SlideCard>

          <SlideCard
            variant="default"
            className="p-4 text-center min-h-0 min-w-0 h-full overflow-hidden"
          >
            <h4 className="text-xs font-bold line-clamp-1 break-words">
              {right.title}
            </h4>
            <div className="text-[11px] opacity-75 line-clamp-3 break-words overflow-hidden">
              {right.content}
            </div>
          </SlideCard>
        </SlideGrid>

        {/* Bottom Satellite */}
        <div className="w-full max-w-md mx-auto shrink-0 min-w-0">
          <SlideCard
            variant="default"
            className="p-3 text-center min-w-0 overflow-hidden"
          >
            <h4 className="text-xs font-bold line-clamp-1 break-words">
              {bottom.title}
            </h4>
            <div className="text-[11px] opacity-75 line-clamp-2 break-words overflow-hidden">
              {bottom.content}
            </div>
          </SlideCard>
        </div>
      </div>
    </SlideSection>
  );
}

import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface BentoDiagonalProps {
  tag?: string;
  title: string;
  subtitle?: string;
  topLeft: { title: string; content: ReactNode };
  topRight: { title: string; content: ReactNode };
  bottomLeft: { title: string; content: ReactNode };
  bottomRight: { title: string; content: ReactNode };
}

/**
 * Cuadrícula Bento con énfasis diagonal (Top-Left y Bottom-Right destacados).
 */
export function BentoDiagonal({
  tag,
  title,
  subtitle,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: BentoDiagonalProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <SlideGrid cols={2} gap="1rem" className="h-full min-h-0 flex-1">
          {/* Top-Left (Glow) */}
          <SlideCard
            variant="glow"
            className="min-h-0 min-w-0 justify-between overflow-hidden p-6"
          >
            <div className="min-h-0 min-w-0 overflow-hidden">
              <h4 className="mb-2 break-words text-xl font-bold line-clamp-2">
                {topLeft.title}
              </h4>
              <div className="break-words text-sm opacity-85 leading-relaxed line-clamp-6">
                {topLeft.content}
              </div>
            </div>
          </SlideCard>

          {/* Top-Right (Default) */}
          <SlideCard
            variant="default"
            className="min-h-0 min-w-0 justify-between overflow-hidden p-6"
          >
            <div className="min-h-0 min-w-0 overflow-hidden">
              <h4 className="mb-2 break-words text-base font-bold line-clamp-2">
                {topRight.title}
              </h4>
              <div className="break-words text-xs opacity-75 leading-relaxed line-clamp-6">
                {topRight.content}
              </div>
            </div>
          </SlideCard>

          {/* Bottom-Left (Default) */}
          <SlideCard
            variant="default"
            className="min-h-0 min-w-0 justify-between overflow-hidden p-6"
          >
            <div className="min-h-0 min-w-0 overflow-hidden">
              <h4 className="mb-2 break-words text-base font-bold line-clamp-2">
                {bottomLeft.title}
              </h4>
              <div className="break-words text-xs opacity-75 leading-relaxed line-clamp-6">
                {bottomLeft.content}
              </div>
            </div>
          </SlideCard>

          {/* Bottom-Right (Glow) */}
          <SlideCard
            variant="glow"
            className="min-h-0 min-w-0 justify-between overflow-hidden p-6"
          >
            <div className="min-h-0 min-w-0 overflow-hidden">
              <h4 className="mb-2 break-words text-xl font-bold line-clamp-2">
                {bottomRight.title}
              </h4>
              <div className="break-words text-sm opacity-85 leading-relaxed line-clamp-6">
                {bottomRight.content}
              </div>
            </div>
          </SlideCard>
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

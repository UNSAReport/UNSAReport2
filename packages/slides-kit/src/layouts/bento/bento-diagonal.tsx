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
      <SlideGrid cols={2} gap="1.5rem" className="my-auto h-full">
        {/* Top-Left (Glow) */}
        <SlideCard variant="glow" className="p-6 justify-between h-full">
          <div>
            <h4 className="text-xl font-bold mb-2">{topLeft.title}</h4>
            <div className="text-sm opacity-85 leading-relaxed">
              {topLeft.content}
            </div>
          </div>
        </SlideCard>

        {/* Top-Right (Default) */}
        <SlideCard variant="default" className="p-6 justify-between h-full">
          <div>
            <h4 className="text-base font-bold mb-2">{topRight.title}</h4>
            <div className="text-xs opacity-75 leading-relaxed">
              {topRight.content}
            </div>
          </div>
        </SlideCard>

        {/* Bottom-Left (Default) */}
        <SlideCard variant="default" className="p-6 justify-between h-full">
          <div>
            <h4 className="text-base font-bold mb-2">{bottomLeft.title}</h4>
            <div className="text-xs opacity-75 leading-relaxed">
              {bottomLeft.content}
            </div>
          </div>
        </SlideCard>

        {/* Bottom-Right (Glow) */}
        <SlideCard variant="glow" className="p-6 justify-between h-full">
          <div>
            <h4 className="text-xl font-bold mb-2">{bottomRight.title}</h4>
            <div className="text-sm opacity-85 leading-relaxed">
              {bottomRight.content}
            </div>
          </div>
        </SlideCard>
      </SlideGrid>
    </SlideSection>
  );
}

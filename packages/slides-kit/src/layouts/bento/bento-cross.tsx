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
      <div className="max-w-4xl mx-auto w-full h-full my-auto flex flex-col justify-between gap-3">
        {/* Top Satellite */}
        <div className="max-w-md mx-auto w-full">
          <SlideCard variant="default" className="p-3 text-center">
            <h4 className="text-xs font-bold">{top.title}</h4>
            <div className="text-[11px] opacity-75">{top.content}</div>
          </SlideCard>
        </div>

        {/* Center Row: Left, Center, Right */}
        <SlideGrid cols={3} gap="1rem" className="items-center">
          <SlideCard variant="default" className="p-4 text-center">
            <h4 className="text-xs font-bold">{left.title}</h4>
            <div className="text-[11px] opacity-75">{left.content}</div>
          </SlideCard>

          <SlideCard variant="glow" className="p-6 text-center shadow-lg">
            <h3 className="text-lg font-bold mb-1">{center.title}</h3>
            <div className="text-xs opacity-85">{center.content}</div>
          </SlideCard>

          <SlideCard variant="default" className="p-4 text-center">
            <h4 className="text-xs font-bold">{right.title}</h4>
            <div className="text-[11px] opacity-75">{right.content}</div>
          </SlideCard>
        </SlideGrid>

        {/* Bottom Satellite */}
        <div className="max-w-md mx-auto w-full">
          <SlideCard variant="default" className="p-3 text-center">
            <h4 className="text-xs font-bold">{bottom.title}</h4>
            <div className="text-[11px] opacity-75">{bottom.content}</div>
          </SlideCard>
        </div>
      </div>
    </SlideSection>
  );
}

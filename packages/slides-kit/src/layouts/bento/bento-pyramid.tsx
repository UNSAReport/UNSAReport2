import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface BentoPyramidProps {
  tag?: string;
  title: string;
  subtitle?: string;
  apex: { title: string; content: ReactNode };
  middle: Array<{ title: string; content: ReactNode }>;
  base: Array<{ title: string; content: ReactNode }>;
}

/**
 * Cuadrícula Bento en pirámide jerárquica (1 cúspide, 2 nivel medio, 3 base).
 */
export function BentoPyramid({
  tag,
  title,
  subtitle,
  apex,
  middle = [],
  base = [],
}: BentoPyramidProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-3 my-auto">
        {/* Apex (Cúspide centrada) */}
        <div className="max-w-md mx-auto w-full">
          <SlideCard variant="glow" className="p-4 text-center">
            <h4 className="text-base font-bold mb-1">{apex.title}</h4>
            <div className="text-xs opacity-80">{apex.content}</div>
          </SlideCard>
        </div>

        {/* Middle (2 cards) */}
        <div className="max-w-3xl mx-auto w-full">
          <SlideGrid cols={2} gap="1rem">
            {middle.slice(0, 2).map((m, idx) => (
              <SlideCard
                key={`pyr-mid-${m.title || idx}`}
                variant="default"
                className="p-4 text-center"
              >
                <h4 className="text-sm font-bold mb-1">{m.title}</h4>
                <div className="text-xs opacity-75">{m.content}</div>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>

        {/* Base (3 cards) */}
        <div className="w-full">
          <SlideGrid cols={3} gap="1rem">
            {base.slice(0, 3).map((b, idx) => (
              <SlideCard
                key={`pyr-base-${b.title || idx}`}
                variant="muted"
                className="p-4 text-center"
              >
                <h4 className="text-xs font-bold mb-1">{b.title}</h4>
                <div className="text-[11px] opacity-70">{b.content}</div>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>
      </div>
    </SlideSection>
  );
}

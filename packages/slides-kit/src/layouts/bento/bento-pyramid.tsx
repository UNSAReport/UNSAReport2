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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {/* Apex (Cúspide centrada) */}
        <div className="max-w-md mx-auto w-full min-w-0 shrink-0 overflow-hidden">
          <SlideCard
            variant="glow"
            className="min-h-0 min-w-0 overflow-hidden p-4 text-center"
          >
            <h4 className="text-base font-bold mb-1 truncate">{apex.title}</h4>
            <div className="text-xs opacity-80 break-words overflow-hidden line-clamp-2">
              {apex.content}
            </div>
          </SlideCard>
        </div>

        {/* Middle (2 cards) */}
        <div className="max-w-3xl mx-auto w-full min-w-0 flex-1 min-h-0 overflow-hidden">
          <SlideGrid cols={2} gap="1rem" className="h-full min-h-0">
            {middle.slice(0, 2).map((m, idx) => (
              <SlideCard
                key={`pyr-mid-${m.title || idx}`}
                variant="default"
                className="min-h-0 min-w-0 h-full overflow-hidden p-4 text-center"
              >
                <h4 className="text-sm font-bold mb-1 truncate">{m.title}</h4>
                <div className="text-xs opacity-75 break-words overflow-hidden line-clamp-3">
                  {m.content}
                </div>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>

        {/* Base (3 cards) */}
        <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden">
          <SlideGrid cols={3} gap="1rem" className="h-full min-h-0">
            {base.slice(0, 3).map((b, idx) => (
              <SlideCard
                key={`pyr-base-${b.title || idx}`}
                variant="muted"
                className="min-h-0 min-w-0 h-full overflow-hidden p-4 text-center"
              >
                <h4 className="text-xs font-bold mb-1 truncate">{b.title}</h4>
                <div className="text-[11px] opacity-70 break-words overflow-hidden line-clamp-3">
                  {b.content}
                </div>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>
      </div>
    </SlideSection>
  );
}

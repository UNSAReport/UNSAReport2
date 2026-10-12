import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface BentoMagazineProps {
  tag?: string;
  title: string;
  subtitle?: string;
  headline: string;
  article: string;
  quote: string;
  quoteAuthor: string;
  statNumber: string;
  statLabel: string;
  sideNote: ReactNode;
}

/**
 * Maquetación editorial estilo revista con titular prominente, cita destacada, métrica y columna de texto.
 */
export function BentoMagazine({
  tag = 'Especial Editorial',
  title,
  subtitle,
  headline,
  article,
  quote,
  quoteAuthor,
  statNumber,
  statLabel,
  sideNote,
}: BentoMagazineProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden">
        <SlideSplit
          ratio="60-40"
          gap="1rem"
          className="min-h-0"
          left={
            <div className="h-full min-h-0 min-w-0 flex flex-col gap-4 overflow-hidden">
              {/* Headline Card */}
              <SlideCard
                variant="glow"
                className="flex-1 min-h-0 min-w-0 p-6 justify-between overflow-hidden"
              >
                <div className="min-w-0">
                  <SlideBadge variant="accent" className="mb-2 shrink-0">
                    Titular Principal
                  </SlideBadge>
                  <h3 className="text-2xl font-black mb-3 min-w-0 line-clamp-2 break-words">
                    {headline}
                  </h3>
                  <p className="text-xs opacity-80 leading-relaxed whitespace-pre-line break-words overflow-hidden line-clamp-6">
                    {article}
                  </p>
                </div>
              </SlideCard>

              {/* Bottom Quote in Left Column */}
              <SlideCard
                variant="muted"
                className="min-w-0 shrink-0 overflow-hidden p-4 border-l-4 border-l-current"
              >
                <blockquote className="text-sm italic opacity-90 mb-1 break-words overflow-hidden line-clamp-3">
                  “{quote}”
                </blockquote>
                <cite className="not-italic text-xs font-bold block opacity-75 truncate">
                  — {quoteAuthor}
                </cite>
              </SlideCard>
            </div>
          }
          right={
            <div className="h-full min-h-0 min-w-0 flex flex-col gap-4 overflow-hidden">
              {/* Stat Card */}
              <SlideCard
                variant="elevated"
                className="min-w-0 shrink-0 overflow-hidden p-6 text-center items-center justify-center"
              >
                <div className="text-5xl font-black font-mono tracking-tight mb-1 truncate min-w-0 w-full">
                  {statNumber}
                </div>
                <span className="text-xs uppercase font-mono opacity-70 block truncate">
                  {statLabel}
                </span>
              </SlideCard>

              {/* Side Note Card */}
              <SlideCard
                variant="default"
                className="flex-1 min-h-0 min-w-0 p-5 justify-between overflow-hidden"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold mb-2 truncate">
                    Nota Técnica
                  </h4>
                  <div className="text-xs opacity-75 leading-relaxed break-words overflow-hidden line-clamp-6">
                    {sideNote}
                  </div>
                </div>
              </SlideCard>
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

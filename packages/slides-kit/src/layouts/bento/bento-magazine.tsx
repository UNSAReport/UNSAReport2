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
      <SlideSplit
        ratio="60-40"
        gap="2rem"
        left={
          <div className="h-full flex flex-col gap-4">
            {/* Headline Card */}
            <SlideCard variant="glow" className="flex-1 p-6 justify-between">
              <div>
                <SlideBadge variant="accent" className="mb-2">
                  Titular Principal
                </SlideBadge>
                <h3 className="text-2xl font-black mb-3">{headline}</h3>
                <p className="text-xs opacity-80 leading-relaxed whitespace-pre-line">
                  {article}
                </p>
              </div>
            </SlideCard>

            {/* Bottom Quote in Left Column */}
            <SlideCard
              variant="muted"
              className="p-4 border-l-4 border-l-current"
            >
              <blockquote className="text-sm italic opacity-90 mb-1">
                “{quote}”
              </blockquote>
              <cite className="not-italic text-xs font-bold block opacity-75">
                — {quoteAuthor}
              </cite>
            </SlideCard>
          </div>
        }
        right={
          <div className="h-full flex flex-col gap-4">
            {/* Stat Card */}
            <SlideCard
              variant="elevated"
              className="p-6 text-center items-center justify-center"
            >
              <div className="text-5xl font-black font-mono tracking-tight mb-1">
                {statNumber}
              </div>
              <span className="text-xs uppercase font-mono opacity-70">
                {statLabel}
              </span>
            </SlideCard>

            {/* Side Note Card */}
            <SlideCard variant="default" className="flex-1 p-5 justify-between">
              <div>
                <h4 className="text-sm font-bold mb-2">Nota Técnica</h4>
                <div className="text-xs opacity-75 leading-relaxed">
                  {sideNote}
                </div>
              </div>
            </SlideCard>
          </div>
        }
      />
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ConvergentSource {
  title: string;
  detail: string;
}

export interface ProcessConvergentProps {
  tag?: string;
  title: string;
  subtitle?: string;
  sources: ConvergentSource[];
  outcomeTitle: string;
  outcomeDescription: string;
  outcomeBadge?: string;
}

/**
 * Múltiples fuentes o entradas metodológicas convergiendo en un único resultado o síntesis.
 */
export function ProcessConvergent({
  tag = 'Síntesis Metodológica',
  title,
  subtitle,
  sources = [],
  outcomeTitle,
  outcomeDescription,
  outcomeBadge,
}: ProcessConvergentProps) {
  const cols = sources.length <= 3 ? 3 : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-between h-full my-auto max-w-5xl mx-auto w-full gap-6">
        {/* Fuentes Superiores */}
        <SlideGrid cols={cols as 3 | 4} gap="1.5rem" className="w-full">
          {sources.map((s, idx) => (
            <SlideCard
              key={`src-${s.title || idx}`}
              variant="default"
              className="p-4 text-center"
            >
              <span className="text-[10px] uppercase font-mono opacity-60 block mb-1">
                Entrada 0{idx + 1}
              </span>
              <h4 className="text-sm font-bold mb-1">{s.title}</h4>
              <p className="text-xs opacity-75">{s.detail}</p>
            </SlideCard>
          ))}
        </SlideGrid>

        {/* Flecha o conector descendente */}
        <div className="flex items-center gap-2 opacity-50 font-mono text-sm">
          <span>↓↓↓ Convergencia e Integración ↓↓↓</span>
        </div>

        {/* Resultado Final Sintetizado */}
        <SlideCard variant="glow" className="w-full max-w-2xl p-6 text-center">
          {outcomeBadge && (
            <div className="mb-2">
              <SlideBadge variant="accent">{outcomeBadge}</SlideBadge>
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2">{outcomeTitle}</h3>
          <p className="text-sm opacity-85 leading-relaxed">
            {outcomeDescription}
          </p>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

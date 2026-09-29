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
      <div className="w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-4 max-w-5xl mx-auto flex-1">
        {/* Fuentes Superiores */}
        <SlideGrid
          cols={cols as 3 | 4}
          gap="1rem"
          className="w-full min-h-0 shrink-0"
        >
          {sources.slice(0, 4).map((s, idx) => (
            <SlideCard
              key={`src-${s.title || idx}`}
              variant="default"
              className="p-4 text-center min-w-0 min-h-0 overflow-hidden"
            >
              <span className="text-[10px] uppercase font-mono opacity-60 block mb-1 truncate">
                Entrada 0{idx + 1}
              </span>
              <h4 className="text-sm font-bold mb-1 truncate break-words min-w-0">
                {s.title}
              </h4>
              <p className="text-xs opacity-75 line-clamp-3 break-words min-w-0">
                {s.detail}
              </p>
            </SlideCard>
          ))}
        </SlideGrid>

        {/* Flecha o conector descendente */}
        <div className="flex items-center gap-2 opacity-50 font-mono text-sm shrink-0 truncate">
          <span className="truncate">↓↓↓ Convergencia e Integración ↓↓↓</span>
        </div>

        {/* Resultado Final Sintetizado */}
        <SlideCard
          variant="glow"
          className="w-full max-w-2xl p-5 text-center shrink-0 min-w-0 overflow-hidden"
        >
          {outcomeBadge && (
            <div className="mb-2">
              <SlideBadge variant="accent">{outcomeBadge}</SlideBadge>
            </div>
          )}
          <h3 className="text-xl font-bold mb-2 truncate break-words">
            {outcomeTitle}
          </h3>
          <p className="text-sm opacity-85 leading-relaxed line-clamp-3 break-words min-w-0">
            {outcomeDescription}
          </p>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

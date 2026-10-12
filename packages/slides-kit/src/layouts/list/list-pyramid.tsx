import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface PyramidLevel {
  level: string;
  description: string;
  percentageWidth: string; // ej: '50%', '75%', '100%'
}

export interface ListPyramidProps {
  tag?: string;
  title: string;
  subtitle?: string;
  levels: PyramidLevel[];
}

/**
 * Jerarquía piramidal estilizada con niveles de ancho escalonado (cúspide a base).
 */
export function ListPyramid({
  tag = 'Jerarquía Conceptual',
  title,
  subtitle,
  levels = [],
}: ListPyramidProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center w-full min-h-0 min-w-0 overflow-hidden">
        <SlideStack
          spacing="1rem"
          className="w-full items-center min-h-0 min-w-0 overflow-hidden"
        >
          {levels.slice(0, 5).map((lvl, idx) => (
            <div
              key={`pyr-lvl-${lvl.level || idx}`}
              className="flex justify-center min-w-0 max-w-full mx-auto"
              style={{
                width: lvl.percentageWidth || `${100 - idx * 12}%`,
                maxWidth: '100%',
              }}
            >
              <SlideCard
                variant={idx === 0 ? 'glow' : 'default'}
                className="w-full p-4 flex-row items-center justify-between text-center min-h-0 min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-4 text-left min-w-0 overflow-hidden">
                  <span className="w-8 h-8 rounded-full border border-current font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    0{idx + 1}
                  </span>
                  <div className="min-w-0 overflow-hidden">
                    <h4 className="text-base font-bold break-words min-w-0 line-clamp-1">
                      {lvl.level}
                    </h4>
                    <p className="text-xs opacity-75 break-words min-w-0 line-clamp-2">
                      {lvl.description}
                    </p>
                  </div>
                </div>
              </SlideCard>
            </div>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitProsConsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  prosTitle?: string;
  pros: string[];
  consTitle?: string;
  cons: string[];
}

/**
 * Dos columnas balanceadas de ventajas (Pros) y desventajas o riesgos (Cons).
 */
export function SplitProsCons({
  tag,
  title,
  subtitle,
  prosTitle = 'Ventajas y Beneficios',
  pros = [],
  consTitle = 'Riesgos y Limitaciones',
  cons = [],
}: SplitProsConsProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 justify-between p-8 border-t-4 border-t-current overflow-hidden"
          >
            <div className="min-h-0 min-w-0 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center gap-4 mb-4 shrink-0">
                <h3 className="text-2xl font-bold truncate min-w-0">
                  {prosTitle}
                </h3>
                <SlideBadge variant="success">Pros</SlideBadge>
              </div>
              <ul className="flex flex-col gap-3 overflow-hidden">
                {pros.slice(0, 5).map((pro) => (
                  <li
                    key={`pro-${pro}`}
                    className="flex items-start gap-3 text-base opacity-90 min-w-0"
                  >
                    <span className="font-bold opacity-80 shrink-0">✓</span>
                    <span className="min-w-0 line-clamp-2 break-words">
                      {pro}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="muted"
            className="h-full min-h-0 min-w-0 justify-between p-8 border-t-4 border-t-current overflow-hidden"
          >
            <div className="min-h-0 min-w-0 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center gap-4 mb-4 shrink-0">
                <h3 className="text-2xl font-bold truncate min-w-0">
                  {consTitle}
                </h3>
                <SlideBadge variant="error">Cons</SlideBadge>
              </div>
              <ul className="flex flex-col gap-3 overflow-hidden">
                {cons.slice(0, 5).map((con) => (
                  <li
                    key={`con-${con}`}
                    className="flex items-start gap-3 text-base opacity-75 min-w-0"
                  >
                    <span className="font-bold opacity-60 shrink-0">✕</span>
                    <span className="min-w-0 line-clamp-2 break-words">
                      {con}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

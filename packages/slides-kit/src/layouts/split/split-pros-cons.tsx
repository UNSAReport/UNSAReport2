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
            className="h-full justify-between p-8 border-t-4 border-t-current"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{prosTitle}</h3>
                <SlideBadge variant="success">Pros</SlideBadge>
              </div>
              <ul className="space-y-3">
                {pros.map((pro) => (
                  <li
                    key={`pro-${pro}`}
                    className="flex items-start gap-3 text-base opacity-90"
                  >
                    <span className="font-bold opacity-80">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="muted"
            className="h-full justify-between p-8 border-t-4 border-t-current"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{consTitle}</h3>
                <SlideBadge variant="error">Cons</SlideBadge>
              </div>
              <ul className="space-y-3">
                {cons.map((con) => (
                  <li
                    key={`con-${con}`}
                    className="flex items-start gap-3 text-base opacity-75"
                  >
                    <span className="font-bold opacity-60">✕</span>
                    <span>{con}</span>
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

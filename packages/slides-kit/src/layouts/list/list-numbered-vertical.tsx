import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface NumberedListItem {
  number: string | number;
  title: string;
  description: string;
}

export interface ListNumberedVerticalProps {
  tag?: string;
  title: string;
  subtitle?: string;
  items: NumberedListItem[];
}

/**
 * Lista vertical numerada de alto impacto visual para fases o prioridades críticas.
 */
export function ListNumberedVertical({
  tag = 'Prioridades',
  title,
  subtitle,
  items = [],
}: ListNumberedVerticalProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideStack spacing="1.25rem">
          {items.map((item, idx) => (
            <SlideCard
              key={`num-vert-${item.number || idx}`}
              variant="default"
              className="p-5 flex-row items-center gap-6"
            >
              <span className="text-3xl font-black font-mono w-14 text-center shrink-0 opacity-70 border-r border-current/10 pr-4">
                {typeof item.number === 'number' && item.number < 10
                  ? `0${item.number}`
                  : item.number}
              </span>
              <div className="flex-1">
                <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                <p className="text-sm opacity-75">{item.description}</p>
              </div>
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

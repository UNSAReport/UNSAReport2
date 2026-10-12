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
      <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col justify-center overflow-hidden">
        <SlideStack
          spacing="1.25rem"
          className="min-h-0 min-w-0 overflow-hidden"
        >
          {items.slice(0, 5).map((item, idx) => (
            <SlideCard
              key={`num-vert-${item.number || idx}`}
              variant="default"
              className="p-5 flex-row items-center gap-6 min-h-0 min-w-0 overflow-hidden"
            >
              <span className="text-3xl font-black font-mono w-14 text-center shrink-0 opacity-70 border-r border-current/10 pr-4">
                {typeof item.number === 'number' && item.number < 10
                  ? `0${item.number}`
                  : item.number}
              </span>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h4 className="text-lg font-bold mb-1 break-words min-w-0 line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-sm opacity-75 break-words min-w-0 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

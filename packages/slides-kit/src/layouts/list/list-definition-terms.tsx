import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface TermDefinition {
  term: string;
  category?: string;
  definition: string;
}

export interface ListDefinitionTermsProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  terms: TermDefinition[];
}

/**
 * Glosario o lista de definiciones terminológicas esenciales para fundamentación teórica.
 */
export function ListDefinitionTerms({
  tag = 'Glosario Técnico',
  title = 'Definición de Términos Clave',
  subtitle = 'Conceptos operacionales adoptados a lo largo de la investigación.',
  terms = [],
}: ListDefinitionTermsProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={2}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {terms.slice(0, 4).map((t, idx) => (
          <SlideCard
            key={`term-${t.term || idx}`}
            variant="default"
            className="p-6 justify-start min-w-0 min-h-0 overflow-hidden"
          >
            <div className="flex justify-between items-baseline gap-4 mb-2">
              <h4 className="text-xl font-bold font-mono line-clamp-1 break-words min-w-0">
                {t.term}
              </h4>
              {t.category && (
                <span className="text-[10px] uppercase font-mono opacity-50 tracking-wider shrink-0 truncate">
                  {t.category}
                </span>
              )}
            </div>
            <p className="text-sm opacity-80 leading-relaxed border-t border-current/10 pt-3 line-clamp-4 break-words overflow-hidden">
              {t.definition}
            </p>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

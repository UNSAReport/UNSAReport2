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
      <SlideGrid cols={2} gap="1.5rem" className="my-auto">
        {terms.map((t, idx) => (
          <SlideCard
            key={`term-${t.term || idx}`}
            variant="default"
            className="p-6 justify-start"
          >
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="text-xl font-bold font-mono">{t.term}</h4>
              {t.category && (
                <span className="text-[10px] uppercase font-mono opacity-50 tracking-wider">
                  {t.category}
                </span>
              )}
            </div>
            <p className="text-sm opacity-80 leading-relaxed border-t border-current/10 pt-3">
              {t.definition}
            </p>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

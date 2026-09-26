import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface CreditGroup {
  category: string;
  members: string[];
}

export interface ClosingCreditsScrollProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  groups: CreditGroup[];
  footerNote?: string;
}

/**
 * Diapositiva de agradecimientos institucionales y créditos para proyectos colaborativos.
 */
export function ClosingCreditsScroll({
  tag = 'Reconocimientos',
  title = 'Agradecimientos y Créditos',
  subtitle = 'A todas las personas e instituciones que hicieron posible este trabajo.',
  groups = [],
  footerNote,
}: ClosingCreditsScrollProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="my-auto w-full">
        <SlideGrid columns={groups.length > 3 ? 4 : 3} gap="2.5rem">
          {groups.map((grp, idx) => (
            <div
              key={`credit-grp-${grp.category || idx}`}
              className="flex flex-col border-l-2 border-current/20 pl-6 py-2"
            >
              <h4 className="text-xs uppercase font-mono tracking-wider opacity-75 mb-3">
                {grp.category}
              </h4>
              <ul className="space-y-2 text-base font-medium">
                {grp.members.map((member, mIdx) => (
                  <li key={`credit-mem-${member || mIdx}`}>{member}</li>
                ))}
              </ul>
            </div>
          ))}
        </SlideGrid>

        {footerNote && (
          <div className="text-center text-xs opacity-60 mt-6 pt-4 border-t border-current/10 max-w-xl mx-auto">
            {footerNote}
          </div>
        )}
      </div>
    </SlideSection>
  );
}

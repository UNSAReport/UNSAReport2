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
  const visibleGroups = groups.slice(0, 6);
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col justify-center overflow-hidden">
        <SlideGrid
          columns={3}
          gap="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden items-stretch"
        >
          {visibleGroups.map((grp, idx) => (
            <div
              key={`credit-grp-${grp.category || idx}`}
              className="flex flex-col min-h-0 min-w-0 overflow-hidden border-l-2 border-current/20 pl-6 py-2"
            >
              <h4 className="text-xs uppercase font-mono tracking-wider opacity-75 mb-3 line-clamp-1 break-words min-w-0 shrink-0">
                {grp.category}
              </h4>
              <ul className="flex-1 min-h-0 overflow-hidden space-y-2 text-base font-medium">
                {grp.members.slice(0, 6).map((member, mIdx) => (
                  <li
                    key={`credit-mem-${member || mIdx}`}
                    className="line-clamp-1 break-words min-w-0"
                  >
                    {member}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </SlideGrid>

        {footerNote && (
          <div className="text-center text-xs opacity-60 mt-4 pt-4 border-t border-current/10 max-w-xl mx-auto w-full line-clamp-2 break-words min-w-0 shrink-0">
            {footerNote}
          </div>
        )}
      </div>
    </SlideSection>
  );
}

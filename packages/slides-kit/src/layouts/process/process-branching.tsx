import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface BranchInfo {
  title: string;
  badge?: string;
  steps: string[];
}

export interface ProcessBranchingProps {
  tag?: string;
  title: string;
  subtitle?: string;
  initialStep: string;
  branchA: BranchInfo;
  branchB: BranchInfo;
  mergeStep: string;
}

/**
 * Proceso con bifurcación paralela (Branch A / Branch B) y posterior convergencia.
 */
export function ProcessBranching({
  tag = 'Flujo de Ramificación',
  title,
  subtitle,
  initialStep,
  branchA,
  branchB,
  mergeStep,
}: ProcessBranchingProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-4 max-w-4xl mx-auto flex-1">
        {/* Paso Inicial */}
        <SlideCard
          variant="glow"
          className="w-full max-w-md p-4 text-center shrink-0 min-w-0"
        >
          <span className="text-[10px] uppercase font-mono opacity-60 block truncate">
            Entrada Común
          </span>
          <h4 className="text-base font-bold truncate break-words">
            {initialStep}
          </h4>
        </SlideCard>

        {/* Bifurcación */}
        <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden">
          <SlideSplit
            ratio="50-50"
            gap="1rem"
            left={
              <SlideCard
                variant="default"
                className="p-4 min-h-0 min-w-0 overflow-hidden"
              >
                <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                  <h4 className="text-sm font-bold truncate break-words min-w-0">
                    {branchA.title}
                  </h4>
                  {branchA.badge && (
                    <SlideBadge
                      variant="secondary"
                      className="text-[10px] shrink-0"
                    >
                      {branchA.badge}
                    </SlideBadge>
                  )}
                </div>
                <ul className="space-y-1.5 overflow-hidden">
                  {branchA.steps.slice(0, 4).map((s) => (
                    <li
                      key={`bra-s-${s}`}
                      className="text-xs opacity-75 truncate break-words"
                    >
                      • {s}
                    </li>
                  ))}
                </ul>
              </SlideCard>
            }
            right={
              <SlideCard
                variant="default"
                className="p-4 min-h-0 min-w-0 overflow-hidden"
              >
                <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                  <h4 className="text-sm font-bold truncate break-words min-w-0">
                    {branchB.title}
                  </h4>
                  {branchB.badge && (
                    <SlideBadge
                      variant="accent"
                      className="text-[10px] shrink-0"
                    >
                      {branchB.badge}
                    </SlideBadge>
                  )}
                </div>
                <ul className="space-y-1.5 overflow-hidden">
                  {branchB.steps.slice(0, 4).map((s) => (
                    <li
                      key={`brb-s-${s}`}
                      className="text-xs opacity-75 truncate break-words"
                    >
                      • {s}
                    </li>
                  ))}
                </ul>
              </SlideCard>
            }
          />
        </div>

        {/* Paso de Fusión */}
        <SlideCard
          variant="glow"
          className="w-full max-w-md p-4 text-center shrink-0 min-w-0"
        >
          <span className="text-[10px] uppercase font-mono opacity-60 block truncate">
            Convergencia / Salida
          </span>
          <h4 className="text-base font-bold truncate break-words">
            {mergeStep}
          </h4>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

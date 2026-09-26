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
      <div className="flex flex-col items-center justify-between h-full my-auto max-w-4xl mx-auto gap-4">
        {/* Paso Inicial */}
        <SlideCard variant="glow" className="w-full max-w-md p-4 text-center">
          <span className="text-[10px] uppercase font-mono opacity-60 block">
            Entrada Común
          </span>
          <h4 className="text-base font-bold">{initialStep}</h4>
        </SlideCard>

        {/* Bifurcación */}
        <div className="w-full">
          <SlideSplit
            ratio="50-50"
            gap="2rem"
            left={
              <SlideCard variant="default" className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base font-bold">{branchA.title}</h4>
                  {branchA.badge && (
                    <SlideBadge variant="secondary" className="text-[10px]">
                      {branchA.badge}
                    </SlideBadge>
                  )}
                </div>
                <ul className="space-y-2">
                  {branchA.steps.map((s) => (
                    <li key={`bra-s-${s}`} className="text-xs opacity-75">
                      • {s}
                    </li>
                  ))}
                </ul>
              </SlideCard>
            }
            right={
              <SlideCard variant="default" className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base font-bold">{branchB.title}</h4>
                  {branchB.badge && (
                    <SlideBadge variant="accent" className="text-[10px]">
                      {branchB.badge}
                    </SlideBadge>
                  )}
                </div>
                <ul className="space-y-2">
                  {branchB.steps.map((s) => (
                    <li key={`brb-s-${s}`} className="text-xs opacity-75">
                      • {s}
                    </li>
                  ))}
                </ul>
              </SlideCard>
            }
          />
        </div>

        {/* Paso de Fusión */}
        <SlideCard variant="glow" className="w-full max-w-md p-4 text-center">
          <span className="text-[10px] uppercase font-mono opacity-60 block">
            Convergencia / Salida
          </span>
          <h4 className="text-base font-bold">{mergeStep}</h4>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

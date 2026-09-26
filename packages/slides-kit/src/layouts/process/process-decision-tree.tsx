import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface DecisionBranch {
  condition: string;
  action: string;
  resultBadge?: string;
  isPositive?: boolean;
}

export interface ProcessDecisionTreeProps {
  tag?: string;
  title: string;
  subtitle?: string;
  question: string;
  branchYes: DecisionBranch;
  branchNo: DecisionBranch;
}

/**
 * Diagrama de árbol de decisión con bifurcación binaria (Sí / No) basada en condiciones algorítmicas.
 */
export function ProcessDecisionTree({
  tag = 'Árbol de Decisión',
  title,
  subtitle,
  question,
  branchYes,
  branchNo,
}: ProcessDecisionTreeProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-between h-full my-auto max-w-4xl mx-auto w-full gap-6">
        {/* Pregunta o Nodo de Decisión */}
        <SlideCard variant="glow" className="w-full max-w-lg p-6 text-center">
          <span className="text-xs uppercase font-mono opacity-60 block mb-1">
            Compuerta Condicional
          </span>
          <h3 className="text-xl font-bold">{question}</h3>
        </SlideCard>

        {/* Ramas Sí / No */}
        <div className="w-full">
          <SlideSplit
            ratio="50-50"
            gap="2.5rem"
            left={
              <SlideCard
                variant="default"
                className="p-6 h-full justify-between border-t-4 border-t-current"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <SlideBadge variant="success">Opción: Sí</SlideBadge>
                    {branchYes.resultBadge && (
                      <span className="text-[10px] font-mono opacity-60">
                        {branchYes.resultBadge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold mb-2">
                    {branchYes.condition}
                  </h4>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {branchYes.action}
                  </p>
                </div>
              </SlideCard>
            }
            right={
              <SlideCard
                variant="default"
                className="p-6 h-full justify-between border-t-4 border-t-current"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <SlideBadge variant="error">Opción: No</SlideBadge>
                    {branchNo.resultBadge && (
                      <span className="text-[10px] font-mono opacity-60">
                        {branchNo.resultBadge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold mb-2">
                    {branchNo.condition}
                  </h4>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {branchNo.action}
                  </p>
                </div>
              </SlideCard>
            }
          />
        </div>
      </div>
    </SlideSection>
  );
}

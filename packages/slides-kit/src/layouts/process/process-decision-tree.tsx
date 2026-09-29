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
      <div className="w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-4 max-w-4xl mx-auto flex-1">
        {/* Pregunta o Nodo de Decisión */}
        <SlideCard
          variant="glow"
          className="w-full max-w-lg p-4 text-center shrink-0 min-w-0 overflow-hidden"
        >
          <span className="text-xs uppercase font-mono opacity-60 block mb-1 truncate">
            Compuerta Condicional
          </span>
          <h3 className="text-lg font-bold line-clamp-2 break-words min-w-0">
            {question}
          </h3>
        </SlideCard>

        {/* Ramas Sí / No */}
        <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden">
          <SlideSplit
            ratio="50-50"
            gap="1rem"
            left={
              <SlideCard
                variant="default"
                className="p-4 min-h-0 min-w-0 overflow-hidden border-t-4 border-t-current"
              >
                <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                  <SlideBadge variant="success" className="shrink-0">
                    Opción: Sí
                  </SlideBadge>
                  {branchYes.resultBadge && (
                    <span className="text-[10px] font-mono opacity-60 truncate min-w-0">
                      {branchYes.resultBadge}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold mb-1 line-clamp-2 break-words min-w-0">
                  {branchYes.condition}
                </h4>
                <p className="text-xs opacity-75 leading-relaxed line-clamp-4 break-words min-w-0">
                  {branchYes.action}
                </p>
              </SlideCard>
            }
            right={
              <SlideCard
                variant="default"
                className="p-4 min-h-0 min-w-0 overflow-hidden border-t-4 border-t-current"
              >
                <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
                  <SlideBadge variant="error" className="shrink-0">
                    Opción: No
                  </SlideBadge>
                  {branchNo.resultBadge && (
                    <span className="text-[10px] font-mono opacity-60 truncate min-w-0">
                      {branchNo.resultBadge}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold mb-1 line-clamp-2 break-words min-w-0">
                  {branchNo.condition}
                </h4>
                <p className="text-xs opacity-75 leading-relaxed line-clamp-4 break-words min-w-0">
                  {branchNo.action}
                </p>
              </SlideCard>
            }
          />
        </div>
      </div>
    </SlideSection>
  );
}

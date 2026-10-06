import { SlideSection } from '@/primitives/SlideSection';

export interface LeadStepItem {
  /** Numeral opcional del paso */
  n?: string | number;
  /** Título del paso */
  title: string;
  /** Descripción del paso */
  text: string;
}

export interface SplitLeadPlusStepsProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal del bloque introductorio */
  title: string;
  /** Párrafos introductorios */
  lead?: string[];
  /** Pasos numerados (máximo 4) */
  steps: LeadStepItem[];
}

/**
 * Bloque introductorio superior con fila de pasos numerados debajo.
 */
export function SplitLeadPlusSteps({
  tag,
  title,
  lead = [],
  steps = [],
}: SplitLeadPlusStepsProps) {
  const visible = steps.slice(0, 4);
  return (
    <SlideSection tag={tag} title={title}>
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-5xl mx-auto overflow-hidden">
        {lead.length > 0 && (
          <div className="mb-8 space-y-3 min-w-0 overflow-hidden shrink-0">
            {lead.slice(0, 3).map((paragraph) => (
              <p
                key={`lead-${paragraph.slice(0, 24)}`}
                className="text-lg opacity-80 leading-relaxed line-clamp-3 break-words min-w-0"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 overflow-hidden">
          {visible.map((step, idx) => (
            <div key={`lead-step-${step.title || idx}`} className="min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mb-3"
                style={{
                  backgroundColor:
                    'var(--slide-number-disc, var(--slide-accent))',
                  color: 'var(--slide-on-accent, inherit)',
                }}
              >
                {step.n ?? idx + 1}
              </div>
              <h4 className="text-base font-bold mb-1 line-clamp-2 break-words min-w-0">
                {step.title}
              </h4>
              <p className="text-sm opacity-75 line-clamp-3 break-words min-w-0">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SlideSection>
  );
}

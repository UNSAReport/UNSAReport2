import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitCodePreviewProps {
  tag?: string;
  title: string;
  subtitle?: string;
  language?: string;
  code: string;
  previewTitle?: string;
  preview: ReactNode;
}

/**
 * Código fuente a la izquierda con vista previa visual o componente interactivo a la derecha.
 */
export function SplitCodePreview({
  tag,
  title,
  subtitle,
  language = 'tsx',
  code,
  previewTitle = 'Vista Previa Renderizada',
  preview,
}: SplitCodePreviewProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="elevated"
            padding={0}
            className="h-full min-h-0 min-w-0 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10 shrink-0">
              <span className="text-xs font-mono opacity-70 truncate">
                Componente
              </span>
              <SlideBadge
                variant="secondary"
                className="text-[10px] font-mono shrink-0"
              >
                {language}
              </SlideBadge>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-auto p-6 font-mono text-sm leading-relaxed">
                <pre className="m-0 whitespace-pre-wrap break-words">
                  <code className="break-words">{code}</code>
                </pre>
              </div>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-6"
          >
            <div className="flex justify-between items-center border-b border-current/10 pb-3 mb-4 shrink-0">
              <span className="text-xs uppercase font-mono font-semibold opacity-75 truncate min-w-0">
                {previewTitle}
              </span>
              <SlideBadge variant="accent" className="shrink-0">
                UI Live
              </SlideBadge>
            </div>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center p-4 overflow-hidden">
              <div className="w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden [&>*]:max-w-full [&>*]:max-h-full">
                {preview}
              </div>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

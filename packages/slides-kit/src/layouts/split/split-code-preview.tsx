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
            className="h-full overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-xs font-mono opacity-70">Componente</span>
              <SlideBadge variant="secondary" className="text-[10px] font-mono">
                {language}
              </SlideBadge>
            </div>
            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)]">
              <pre className="m-0">
                <code>{code}</code>
              </pre>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard variant="default" className="h-full justify-between p-6">
            <div className="flex justify-between items-center border-b border-current/10 pb-3 mb-4">
              <span className="text-xs uppercase font-mono font-semibold opacity-75">
                {previewTitle}
              </span>
              <SlideBadge variant="accent">UI Live</SlideBadge>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {preview}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

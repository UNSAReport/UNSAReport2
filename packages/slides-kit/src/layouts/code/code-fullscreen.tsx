import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface CodeFullscreenProps {
  tag?: string;
  title: string;
  subtitle?: string;
  language?: string;
  filename?: string;
  code: string;
  highlightLines?: number[];
}

/**
 * Layout enfocado en presentación de código en formato ventana de editor con cabecera y filename.
 */
export function CodeFullscreen({
  tag,
  title,
  subtitle,
  language = 'typescript',
  filename,
  code,
}: CodeFullscreenProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideCard
        variant="elevated"
        padding={0}
        className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col"
      >
        {/* Barra superior estructural de la ventana */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-current/10 shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block shrink-0" />
            {filename && (
              <span className="ml-3 text-xs font-mono opacity-70 truncate min-w-0">
                {filename}
              </span>
            )}
          </div>
          {language && (
            <SlideBadge
              variant="secondary"
              className="text-[10px] tracking-widest font-mono shrink-0"
            >
              {language}
            </SlideBadge>
          )}
        </div>

        {/* Contenedor de código preformateado */}
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-6 font-mono text-sm leading-relaxed">
          <pre className="m-0 h-full min-w-0 overflow-auto">
            <code className="whitespace-pre-wrap break-all">{code}</code>
          </pre>
        </div>
      </SlideCard>
    </SlideSection>
  );
}

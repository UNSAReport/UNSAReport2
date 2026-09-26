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
        className="w-full h-full overflow-hidden"
      >
        {/* Barra superior estructural de la ventana */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40 inline-block" />
            {filename && (
              <span className="ml-3 text-xs font-mono opacity-70">
                {filename}
              </span>
            )}
          </div>
          {language && (
            <SlideBadge
              variant="secondary"
              className="text-[10px] tracking-widest font-mono"
            >
              {language}
            </SlideBadge>
          )}
        </div>

        {/* Contenedor de código preformateado */}
        <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-45px)]">
          <pre className="m-0">
            <code>{code}</code>
          </pre>
        </div>
      </SlideCard>
    </SlideSection>
  );
}

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
        className="w-full h-full overflow-hidden border border-white/10 bg-[#090d16]"
      >
        {/* Barra superior de la ventana del editor */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            {filename && (
              <span className="ml-3 text-xs font-mono text-[var(--slide-text-muted,#94a3b8)]">
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
        <div className="p-6 overflow-auto font-mono text-sm leading-relaxed text-[var(--slide-text,#f1f5f9)] h-[calc(100%-45px)]">
          <pre className="m-0">
            <code>{code}</code>
          </pre>
        </div>
      </SlideCard>
    </SlideSection>
  );
}

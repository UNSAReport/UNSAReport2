import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface CodeSnippetItem {
  title: string;
  language: string;
  code: string;
  description?: string;
}

export interface CodeSnippetGalleryProps {
  tag?: string;
  title: string;
  subtitle?: string;
  snippets: CodeSnippetItem[];
}

/**
 * Galería cuadrícula de pequeños snippets o funciones utilitarias en tarjetas compactas.
 */
export function CodeSnippetGallery({
  tag = 'Patrones y Utilidades',
  title,
  subtitle,
  snippets = [],
}: CodeSnippetGalleryProps) {
  const visible = snippets.slice(0, 4);
  const cols = visible.length <= 2 ? 2 : visible.length === 3 ? 3 : 2;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <SlideGrid
          cols={cols as 2 | 3}
          gap="1.5rem"
          className="min-h-0 flex-1 overflow-hidden"
        >
          {visible.map((snip, idx) => (
            <SlideCard
              key={`snip-${snip.title || idx}`}
              variant="default"
              padding={0}
              className="overflow-hidden flex flex-col min-w-0 min-h-0"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-current/10 shrink-0 min-w-0">
                <span className="text-xs font-bold font-mono opacity-80 truncate min-w-0 flex-1">
                  {snip.title}
                </span>
                <SlideBadge
                  variant="secondary"
                  className="text-[10px] font-mono shrink-0"
                >
                  {snip.language}
                </SlideBadge>
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-4 font-mono text-xs leading-relaxed">
                <pre className="m-0 h-full min-w-0 overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {snip.code}
                  </code>
                </pre>
              </div>
              {snip.description && (
                <div className="px-4 py-2 border-t border-current/10 text-xs opacity-70 line-clamp-2 break-words min-w-0 shrink-0">
                  {snip.description}
                </div>
              )}
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

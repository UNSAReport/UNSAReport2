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
  const cols = snippets.length <= 2 ? 2 : snippets.length === 3 ? 3 : 2;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={cols as 2 | 3} gap="1.5rem">
        {snippets.map((snip, idx) => (
          <SlideCard
            key={`snip-${snip.title || idx}`}
            variant="default"
            padding={0}
            className="overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-current/10">
              <span className="text-xs font-bold font-mono opacity-80">
                {snip.title}
              </span>
              <SlideBadge variant="secondary" className="text-[10px] font-mono">
                {snip.language}
              </SlideBadge>
            </div>
            <div className="p-4 overflow-auto font-mono text-xs leading-relaxed flex-1">
              <pre className="m-0">
                <code>{snip.code}</code>
              </pre>
            </div>
            {snip.description && (
              <div className="px-4 py-2 border-t border-current/10 text-xs opacity-70">
                {snip.description}
              </div>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

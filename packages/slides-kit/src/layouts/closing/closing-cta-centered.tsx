import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface ClosingCTACenteredProps {
  tag?: string;
  title: string;
  subtitle?: string;
  actionText: string;
  linkUrl?: string;
  linkLabel?: string;
}

/**
 * Diapositiva de llamada a la acción (Call To Action) con enlace o código de acceso destacado.
 */
export function ClosingCTACentered({
  tag = 'Próximo Paso',
  title,
  subtitle,
  actionText,
  linkUrl,
  linkLabel = 'Acceder al Repositorio',
}: ClosingCTACenteredProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col items-center justify-center overflow-hidden p-6 text-center">
        {tag && (
          <div className="mb-4 shrink-0">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-4xl font-black mb-4 tracking-tight leading-tight break-words line-clamp-3 min-w-0 shrink-0"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h2>

        {subtitle && (
          <p className="text-lg opacity-80 mb-6 max-w-xl break-words line-clamp-3 min-w-0 shrink-0">
            {subtitle}
          </p>
        )}

        <SlideCard
          variant="elevated"
          className="p-6 items-center w-full min-w-0 min-h-0 max-w-lg overflow-hidden shrink-0"
        >
          <p className="text-xs uppercase font-mono opacity-60 mb-3 truncate w-full min-w-0">
            {actionText}
          </p>
          {linkUrl && (
            <div className="text-lg font-mono font-bold break-all line-clamp-2 px-4 py-2 rounded border border-current/10 w-full min-w-0 mb-3 overflow-hidden">
              {linkUrl}
            </div>
          )}
          <span className="text-xs opacity-75 font-medium truncate block w-full min-w-0">
            {linkLabel}
          </span>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

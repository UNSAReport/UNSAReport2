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
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto p-6">
        {tag && (
          <div className="mb-6">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-5xl font-black mb-4 tracking-tight leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h2>

        {subtitle && (
          <p className="text-xl opacity-80 mb-8 max-w-xl">{subtitle}</p>
        )}

        <SlideCard
          variant="elevated"
          className="p-6 items-center w-full max-w-lg mb-6"
        >
          <p className="text-xs uppercase font-mono opacity-60 mb-3">
            {actionText}
          </p>
          {linkUrl && (
            <div className="text-xl font-mono font-bold break-all px-4 py-2 rounded border border-current/10 w-full mb-3">
              {linkUrl}
            </div>
          )}
          <span className="text-xs opacity-75 font-medium">{linkLabel}</span>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

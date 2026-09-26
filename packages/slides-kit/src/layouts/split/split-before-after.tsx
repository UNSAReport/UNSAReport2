import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface BeforeAfterContent {
  tag?: string;
  title: string;
  items: string[];
  summary?: string;
}

export interface SplitBeforeAfterProps {
  tag?: string;
  title: string;
  subtitle?: string;
  before: BeforeAfterContent;
  after: BeforeAfterContent;
}

/**
 * Comparación estructural directa de estado previo vs estado optimizado (Antes vs Después).
 */
export function SplitBeforeAfter({
  tag,
  title,
  subtitle,
  before,
  after,
}: SplitBeforeAfterProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="muted"
            className="h-full justify-between p-8 border-l-4 border-l-current"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <SlideBadge variant="secondary">
                  {before.tag || 'Antes'}
                </SlideBadge>
                <span className="text-xs uppercase font-mono opacity-60">
                  Estado Previo
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{before.title}</h3>
              <ul className="space-y-3 mb-6">
                {before.items.map((it) => (
                  <li
                    key={`before-item-${it}`}
                    className="flex items-start gap-2 text-base opacity-75"
                  >
                    <span className="opacity-50">✕</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
            {before.summary && (
              <p className="text-sm opacity-60 border-t border-current/10 pt-4">
                {before.summary}
              </p>
            )}
          </SlideCard>
        }
        right={
          <SlideCard
            variant="glow"
            className="h-full justify-between p-8 border-l-4 border-l-current"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <SlideBadge variant="accent">
                  {after.tag || 'Después'}
                </SlideBadge>
                <span className="text-xs uppercase font-mono opacity-80">
                  Estado Optimizado
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{after.title}</h3>
              <ul className="space-y-3 mb-6">
                {after.items.map((it) => (
                  <li
                    key={`after-item-${it}`}
                    className="flex items-start gap-2 text-base opacity-90 font-medium"
                  >
                    <span className="opacity-80">✓</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
            {after.summary && (
              <p className="text-sm opacity-80 border-t border-current/10 pt-4">
                {after.summary}
              </p>
            )}
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

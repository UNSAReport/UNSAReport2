import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDivider } from '@/primitives/SlideDivider';
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
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 items-stretch"
        left={
          <SlideCard
            variant="muted"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-8 border-l-4 border-l-current"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center gap-3 mb-4 min-w-0">
                <SlideBadge variant="secondary">
                  {before.tag || 'Antes'}
                </SlideBadge>
                <span className="text-xs uppercase font-mono opacity-60 truncate">
                  Estado Previo
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4 line-clamp-2 break-words">
                {before.title}
              </h3>
              <ul className="space-y-3 mb-6 overflow-hidden">
                {before.items.slice(0, 5).map((it) => (
                  <li
                    key={`before-item-${it}`}
                    className="flex items-start gap-2 text-base opacity-75 min-w-0"
                  >
                    <span className="opacity-50 shrink-0">✕</span>
                    <span className="line-clamp-2 break-words min-w-0">
                      {it}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {before.summary && (
              <div className="shrink-0">
                <SlideDivider thickness="1px" opacity={0.12} />
                <p className="text-sm opacity-60 pt-4 line-clamp-2 break-words">
                  {before.summary}
                </p>
              </div>
            )}
          </SlideCard>
        }
        right={
          <SlideCard
            variant="glow"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-8 border-l-4 border-l-current"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center gap-3 mb-4 min-w-0">
                <SlideBadge variant="accent">
                  {after.tag || 'Después'}
                </SlideBadge>
                <span className="text-xs uppercase font-mono opacity-80 truncate">
                  Estado Optimizado
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4 line-clamp-2 break-words">
                {after.title}
              </h3>
              <ul className="space-y-3 mb-6 overflow-hidden">
                {after.items.slice(0, 5).map((it) => (
                  <li
                    key={`after-item-${it}`}
                    className="flex items-start gap-2 text-base opacity-90 font-medium min-w-0"
                  >
                    <span className="opacity-80 shrink-0">✓</span>
                    <span className="line-clamp-2 break-words min-w-0">
                      {it}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {after.summary && (
              <div className="shrink-0">
                <SlideDivider thickness="1px" opacity={0.12} />
                <p className="text-sm opacity-80 pt-4 line-clamp-2 break-words">
                  {after.summary}
                </p>
              </div>
            )}
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

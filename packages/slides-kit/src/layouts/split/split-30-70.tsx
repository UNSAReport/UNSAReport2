import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface Split3070Props {
  tag?: string;
  title: string;
  subtitle?: string;
  sidebarBadge?: string;
  sidebarTitle: string;
  sidebarItems?: string[];
  mainTitle?: string;
  mainContent: ReactNode;
}

/**
 * Columna lateral estrecha (30%) con resumen o metadatos y área de contenido principal amplia (70%).
 */
export function Split3070({
  tag,
  title,
  subtitle,
  sidebarBadge,
  sidebarTitle,
  sidebarItems = [],
  mainTitle,
  mainContent,
}: Split3070Props) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="30-70"
        gap="2rem"
        left={
          <SlideCard variant="muted" className="h-full justify-between p-6">
            <div>
              {sidebarBadge && (
                <div className="mb-4">
                  <SlideBadge variant="secondary">{sidebarBadge}</SlideBadge>
                </div>
              )}
              <h3 className="text-xl font-bold mb-4">{sidebarTitle}</h3>
              <ul className="space-y-3">
                {sidebarItems.map((item) => (
                  <li
                    key={`side-item-${item}`}
                    className="text-sm opacity-80 border-b border-current/10 pb-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard variant="default" className="h-full justify-start p-8">
            {mainTitle && (
              <h3 className="text-2xl font-bold mb-4">{mainTitle}</h3>
            )}
            <div className="text-base leading-relaxed opacity-90">
              {mainContent}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

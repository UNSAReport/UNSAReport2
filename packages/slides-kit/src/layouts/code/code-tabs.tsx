import { useState } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface CodeTabItem {
  id: string;
  label: string;
  language: string;
  code: string;
}

export interface CodeTabsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  tabs: CodeTabItem[];
}

/**
 * Diapositiva con pestañas navegables para comparar implementaciones en diferentes lenguajes o capas.
 */
export function CodeTabs({
  tag = 'Comparativa de Código',
  title,
  subtitle,
  tabs = [],
}: CodeTabsProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '');
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideCard
        variant="elevated"
        padding={0}
        className="w-full h-full overflow-hidden"
      >
        {/* Barra superior de pestañas */}
        <div className="flex items-center px-4 pt-2 gap-2 border-b border-current/10">
          {tabs.map((tab, idx) => {
            const isActive = tab.id === (activeTab?.id || '');
            return (
              <button
                type="button"
                key={`tab-btn-${tab.id || idx}`}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-4 py-2 font-mono text-xs font-semibold rounded-t border-t border-x transition-all ${
                  isActive
                    ? 'border-current border-b-transparent opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bloque de código de la pestaña activa */}
        {activeTab && (
          <div className="p-6 overflow-auto font-mono text-sm leading-relaxed h-[calc(100%-48px)]">
            <pre className="m-0">
              <code>{activeTab.code}</code>
            </pre>
          </div>
        )}
      </SlideCard>
    </SlideSection>
  );
}

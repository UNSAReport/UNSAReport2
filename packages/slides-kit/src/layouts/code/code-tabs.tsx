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
        className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col"
      >
        {/* Barra superior de pestañas */}
        <div className="flex items-center px-4 pt-2 gap-2 border-b border-current/10 shrink-0 min-w-0 overflow-hidden">
          {tabs.slice(0, 6).map((tab, idx) => {
            const isActive = tab.id === (activeTab?.id || '');
            return (
              <button
                type="button"
                key={`tab-btn-${tab.id || idx}`}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-4 py-2 font-mono text-xs font-semibold rounded-t border-t border-x transition-all shrink-0 max-w-40 truncate ${
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
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-6 font-mono text-sm leading-relaxed">
            <pre className="m-0 h-full min-w-0 overflow-auto">
              <code className="whitespace-pre-wrap break-all">
                {activeTab.code}
              </code>
            </pre>
          </div>
        )}
      </SlideCard>
    </SlideSection>
  );
}

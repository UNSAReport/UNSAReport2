import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface HierarchyNode {
  category: string;
  badge?: string;
  childrenItems: string[];
}

export interface ListHierarchyTreeProps {
  tag?: string;
  title: string;
  subtitle?: string;
  rootTitle?: string;
  nodes: HierarchyNode[];
}

/**
 * Diagrama de estructura jerárquica con nodo raíz superior y ramas subordinadas en tarjetas.
 */
export function ListHierarchyTree({
  tag = 'Estructura Organizacional',
  title,
  subtitle,
  rootTitle = 'Módulo Central',
  nodes = [],
}: ListHierarchyTreeProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center flex-1 min-h-0 min-w-0 overflow-hidden gap-4">
        {/* Nodo Raíz */}
        <SlideCard
          variant="glow"
          className="px-8 py-4 text-center max-w-md w-full shrink-0 min-w-0 overflow-hidden"
        >
          <span className="text-xs uppercase font-mono tracking-wider opacity-60 block">
            Nodo Raíz
          </span>
          <h3 className="text-xl font-bold line-clamp-1 break-words min-w-0">
            {rootTitle}
          </h3>
        </SlideCard>

        {/* Línea conectora */}
        <div className="w-0.5 h-6 shrink-0 bg-current opacity-20" />
        {/* Nodos Hijos */}
        <SlideGrid
          cols={nodes.length > 3 ? 4 : (nodes.length as 1 | 2 | 3)}
          gap="1.5rem"
          className="w-full flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {nodes.slice(0, 4).map((node, idx) => (
            <SlideCard
              key={`node-${node.category || idx}`}
              variant="default"
              className="p-6 min-w-0 min-h-0 max-w-full overflow-hidden"
            >
              <div className="flex justify-between items-center gap-2 mb-3 border-b border-current/10 pb-2 min-w-0">
                <h4 className="text-base font-bold line-clamp-1 break-words min-w-0">
                  {node.category}
                </h4>
                {node.badge && (
                  <SlideBadge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                  >
                    {node.badge}
                  </SlideBadge>
                )}
              </div>
              <ul className="space-y-2 min-w-0 overflow-hidden">
                {node.childrenItems.slice(0, 5).map((child) => (
                  <li
                    key={`child-${child}`}
                    className="text-xs opacity-80 flex items-center gap-2 min-w-0"
                  >
                    <span className="opacity-50 shrink-0">└─</span>
                    <span className="line-clamp-1 break-words min-w-0">
                      {child}
                    </span>
                  </li>
                ))}
              </ul>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

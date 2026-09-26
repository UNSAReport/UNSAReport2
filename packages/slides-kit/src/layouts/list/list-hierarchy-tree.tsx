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
      <div className="flex flex-col items-center h-full justify-between gap-6 my-auto">
        {/* Nodo Raíz */}
        <SlideCard
          variant="glow"
          className="px-8 py-4 text-center max-w-md w-full"
        >
          <span className="text-xs uppercase font-mono tracking-wider opacity-60 block">
            Nodo Raíz
          </span>
          <h3 className="text-xl font-bold">{rootTitle}</h3>
        </SlideCard>

        {/* Línea conectora */}
        <div className="w-0.5 h-6 bg-current opacity-20" />

        {/* Nodos Hijos */}
        <SlideGrid
          cols={nodes.length > 3 ? 4 : (nodes.length as 1 | 2 | 3)}
          gap="1.5rem"
          className="w-full"
        >
          {nodes.map((node, idx) => (
            <SlideCard
              key={`node-${node.category || idx}`}
              variant="default"
              className="p-6"
            >
              <div className="flex justify-between items-center mb-3 border-b border-current/10 pb-2">
                <h4 className="text-base font-bold">{node.category}</h4>
                {node.badge && (
                  <SlideBadge variant="secondary" className="text-[10px]">
                    {node.badge}
                  </SlideBadge>
                )}
              </div>
              <ul className="space-y-2">
                {node.childrenItems.map((child) => (
                  <li
                    key={`child-${child}`}
                    className="text-xs opacity-80 flex items-center gap-2"
                  >
                    <span className="opacity-50">└─</span>
                    <span>{child}</span>
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

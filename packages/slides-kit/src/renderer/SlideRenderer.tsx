import { layoutRegistry } from '../layouts/registry';
import { SlideCard } from '../primitives/SlideCard';
import type { SlideDefinition } from '../types';

export interface SlideRendererProps {
  /** Definición declarativa de la diapositiva a renderizar */
  slide: SlideDefinition;
  /** Índice opcional de la diapositiva en el deck */
  index?: number;
}

/**
 * Motor de resolución de diapositivas: mapea un SlideDefinition a su componente React correspondiente.
 */
export function SlideRenderer({ slide, index }: SlideRendererProps) {
  const { layout, component: CustomComponent, notes, children, ...props } = slide;

  // 1. Manejo de slides completamente personalizadas en React
  if (layout === 'custom') {
    if (CustomComponent) {
      return (
        <div className="w-full h-full relative">
          <CustomComponent {...props}>{children}</CustomComponent>
          {notes && <aside className="notes">{notes}</aside>}
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        {children}
        {notes && <aside className="notes">{notes}</aside>}
      </div>
    );
  }

  // 2. Búsqueda en el LayoutRegistry
  const layoutDef = layoutRegistry.getLayout(layout);

  if (!layoutDef) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12 bg-rose-950/40 text-rose-200">
        <SlideCard variant="outlined" className="max-w-xl p-8 border-rose-500/50 bg-rose-900/30">
          <h3 className="text-2xl font-bold mb-2 text-rose-400">
            ⚠️ Layout no encontrado: &apos;{layout}&apos;
          </h3>
          <p className="text-sm text-rose-200/80 mb-4">
            La diapositiva #{index !== undefined ? index + 1 : ''} especifica un layout no registrado en
            LayoutRegistry.
          </p>
          <div className="text-xs font-mono bg-black/40 p-3 rounded text-rose-300">
            Verifica el archivo deck.config.ts o ejecuta &apos;unsarep slides layouts&apos; para ver los nombres disponibles.
          </div>
        </SlideCard>
        {notes && <aside className="notes">{notes}</aside>}
      </div>
    );
  }

  const LayoutComponent = layoutDef.component;

  return (
    <div className="w-full h-full relative">
      <LayoutComponent {...props}>{children}</LayoutComponent>
      {/* Contenedor oficial de notas de orador de Reveal.js */}
      {notes && <aside className="notes">{notes}</aside>}
    </div>
  );
}

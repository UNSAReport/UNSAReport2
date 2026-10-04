import { layoutRegistry } from '@/layouts/registry';
import { SlideCard } from '@/primitives/SlideCard';
import type { SlideDefinition } from '@/types';

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
  const {
    layout,
    component: CustomComponent,
    notes,
    children,
    ...props
  } = slide;

  const normalizedLayout = layout.trim().toLowerCase();

  // 1. Manejo de slides completamente personalizadas en React
  if (normalizedLayout === 'custom') {
    if (CustomComponent) {
      return (
        <>
          <div className="w-full h-full relative">
            <CustomComponent {...props}>{children}</CustomComponent>
          </div>
          {notes && <aside className="notes">{notes}</aside>}
        </>
      );
    }

    if (children) {
      return (
        <>
          <div className="w-full h-full relative">{children}</div>
          {notes && <aside className="notes">{notes}</aside>}
        </>
      );
    }

    if (
      typeof process === 'undefined' ||
      process.env?.NODE_ENV !== 'production'
    ) {
      const label = index !== undefined ? ` #${index + 1}` : '';
      console.warn(
        `SlideRenderer: slide${label} with layout 'custom' has no component and no children; rendering unknown-layout fallback.`,
      );
    }
    return (
      <>
        <div
          className="w-full h-full flex items-center justify-center p-12"
          style={{
            backgroundColor: 'var(--slide-bg, #4c0519)',
            color: 'var(--slide-text, #fecdd3)',
          }}
        >
          <SlideCard
            variant="outlined"
            className="max-w-xl p-8"
            style={{
              borderColor: 'var(--slide-error, #fb7185)',
              backgroundColor: 'var(--slide-surface, rgba(136, 19, 55, 0.3))',
            }}
          >
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--slide-error, #fb7185)' }}
            >
              ⚠️ Layout no encontrado: &apos;{layout}&apos;
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--slide-text-muted, #fda4af)' }}
            >
              La diapositiva #{index !== undefined ? index + 1 : ''} especifica
              un layout no registrado en LayoutRegistry.
            </p>
            <div
              className="text-xs font-mono p-3 rounded"
              style={{
                backgroundColor:
                  'var(--slide-surface-muted, rgba(0, 0, 0, 0.4))',
                color: 'var(--slide-text-muted, #fda4af)',
              }}
            >
              Verifica el archivo deck.config.ts o ejecuta &apos;unsarep slides
              layouts&apos; para ver los nombres disponibles.
            </div>
          </SlideCard>
        </div>
        {notes && <aside className="notes">{notes}</aside>}
      </>
    );
  }

  // 2. Búsqueda en el LayoutRegistry (ids normalizados: trim + lowercase)
  const layoutDef = layoutRegistry.getLayout(normalizedLayout);

  if (!layoutDef) {
    return (
      <>
        <div
          className="w-full h-full flex items-center justify-center p-12"
          style={{
            backgroundColor: 'var(--slide-bg, #4c0519)',
            color: 'var(--slide-text, #fecdd3)',
          }}
        >
          <SlideCard
            variant="outlined"
            className="max-w-xl p-8"
            style={{
              borderColor: 'var(--slide-error, #fb7185)',
              backgroundColor: 'var(--slide-surface, rgba(136, 19, 55, 0.3))',
            }}
          >
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--slide-error, #fb7185)' }}
            >
              ⚠️ Layout no encontrado: &apos;{layout}&apos;
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--slide-text-muted, #fda4af)' }}
            >
              La diapositiva #{index !== undefined ? index + 1 : ''} especifica
              un layout no registrado en LayoutRegistry.
            </p>
            <div
              className="text-xs font-mono p-3 rounded"
              style={{
                backgroundColor:
                  'var(--slide-surface-muted, rgba(0, 0, 0, 0.4))',
                color: 'var(--slide-text-muted, #fda4af)',
              }}
            >
              Verifica el archivo deck.config.ts o ejecuta &apos;unsarep slides
              layouts&apos; para ver los nombres disponibles.
            </div>
          </SlideCard>
        </div>
        {notes && <aside className="notes">{notes}</aside>}
      </>
    );
  }
  const LayoutComponent = layoutDef.component;

  if (
    typeof process === 'undefined' ||
    process.env?.NODE_ENV !== 'production'
  ) {
    const values = props as Record<string, unknown>;
    const known: Record<string, true> = {
      tag: true,
      title: true,
      subtitle: true,
      className: true,
    };
    const availableNames: string[] = [
      "'tag'",
      "'title'",
      "'subtitle'",
      "'className'",
    ];
    for (const slot of layoutDef.slots) {
      if (!known[slot.name]) {
        known[slot.name] = true;
        availableNames.push(`'${slot.name}'`);
      }
    }
    const missingNames: string[] = [];
    for (const slot of layoutDef.slots) {
      if (!slot.required) continue;
      const value = values[slot.name];
      let empty = value === undefined || value === null;
      if (!empty && typeof value === 'string')
        empty = value.trim().length === 0;
      if (!empty && Array.isArray(value)) empty = value.length === 0;
      if (empty) missingNames.push(`'${slot.name}'`);
    }
    if (missingNames.length > 0) {
      const label = index !== undefined ? ` #${index + 1}` : '';
      const plural = missingNames.length > 1 ? 's' : '';
      console.warn(
        `SlideRenderer: slide${label} with layout '${layout}' is missing required slot${plural}: ${missingNames.join(', ')}.`,
      );
    }
    const unknownNames: string[] = [];
    for (const key of Object.keys(values)) {
      if (!known[key]) unknownNames.push(`'${key}'`);
    }
    if (unknownNames.length > 0) {
      const label = index !== undefined ? ` #${index + 1}` : '';
      const plural = unknownNames.length > 1 ? 's' : '';
      console.warn(
        `SlideRenderer: slide${label} with layout '${layout}' has unknown prop${plural}: ${unknownNames.join(', ')}. Possible typo? Available slots: ${availableNames.join(', ')}.`,
      );
    }
  }

  return (
    <>
      <div className="w-full h-full relative">
        <LayoutComponent {...props}>{children}</LayoutComponent>
      </div>
      {/* Contenedor oficial de notas de orador de Reveal.js */}
      {notes && <aside className="notes">{notes}</aside>}
    </>
  );
}

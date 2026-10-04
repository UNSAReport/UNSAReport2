import { defaultLayouts } from '@/layouts/catalog';
import { LayoutCategory, type LayoutDefinition } from '@/layouts/types';

export type { LayoutDefinition };
export { LayoutCategory };

export interface LayoutFilter {
  category?: LayoutCategory;
  search?: string;
}

const LAYOUT_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function assertValidLayout(def: LayoutDefinition): void {
  if (typeof def !== 'object' || def === null) {
    throw new TypeError(
      'Invalid layout "def": expected a LayoutDefinition object.',
    );
  }
  if (typeof def.id !== 'string' || !LAYOUT_ID_PATTERN.test(def.id)) {
    throw new TypeError(
      `Invalid layout "id": expected a non-empty kebab-case string, got ${JSON.stringify((def as LayoutDefinition | undefined)?.id)}.`,
    );
  }
  if (typeof def.component !== 'function') {
    throw new TypeError(
      `Invalid layout "component" for id '${def.id}': expected a function (React component).`,
    );
  }
  if (!Array.isArray(def.slots)) {
    throw new TypeError(
      `Invalid layout "slots" for id '${def.id}': expected an array.`,
    );
  }
}

/**
 * Registro dinámico de layouts con soporte de búsqueda, filtrado y registro en caliente.
 */
export class LayoutRegistry {
  private layouts = new Map<string, LayoutDefinition>();

  constructor() {
    for (const layout of defaultLayouts) {
      this.registerLayout(layout);
    }
  }

  /**
   * Registra un nuevo layout o reemplaza uno existente con el mismo ID.
   * Last-wins (HMR-safe): el re-registro sobrescribe y avisa solo en dev.
   */
  registerLayout(def: LayoutDefinition): void {
    assertValidLayout(def);
    if (
      this.layouts.has(def.id) &&
      (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production')
    ) {
      console.warn(
        `LayoutRegistry: overwriting existing layout '${def.id}'. Last registration wins.`,
      );
    }
    this.layouts.set(def.id, def);
  }

  /**
   * Obtiene la definición de un layout si existe, o undefined si no está registrado.
   */
  getLayout(id: string): LayoutDefinition | undefined {
    return this.layouts.get(id);
  }

  /**
   * Obtiene la definición de un layout asegurando su existencia, o arroja un error descriptivo.
   */
  requireLayout(id: string): LayoutDefinition {
    const layout = this.layouts.get(id);
    if (!layout) {
      const available = Array.from(this.layouts.keys()).join(', ');
      throw new Error(
        `Layout '${id}' no encontrado en LayoutRegistry. Layouts disponibles: [${available}]`,
      );
    }
    return layout;
  }

  /**
   * Lista todos los layouts registrados, con filtros opcionales de categoría o búsqueda textual.
   */
  listLayouts(filter?: LayoutFilter): LayoutDefinition[] {
    let list = Array.from(this.layouts.values());

    if (filter?.category) {
      list = list.filter((l) => l.category === filter.category);
    }

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.id.toLowerCase().includes(term) ||
          l.name.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.tags.some((t: string) => t.toLowerCase().includes(term)),
      );
    }

    return list;
  }

  /**
   * Devuelve la lista ordenada de todas las familias/categorías funcionales de layout disponibles.
   */
  listCategories(): LayoutCategory[] {
    return Object.values(LayoutCategory);
  }

  /**
   * Comprueba si un layout específico está registrado.
   */
  hasLayout(id: string): boolean {
    return this.layouts.has(id);
  }

  /**
   * Devuelve la cantidad de layouts actualmente registrados.
   */
  count(): number {
    return this.layouts.size;
  }

  /**
   * Elimina un layout del registro. Devuelve true si existía.
   */
  unregisterLayout(id: string): boolean {
    return this.layouts.delete(id);
  }

  /**
   * Limpia el registro y lo re-siembras desde el catálogo por defecto.
   */
  resetLayouts(): void {
    this.layouts.clear();
    for (const layout of defaultLayouts) {
      this.registerLayout(layout);
    }
  }
}

/** Instancia única global del registro de layouts */
export const layoutRegistry = new LayoutRegistry();

/** Obtiene la definición de un layout */
export const getLayout = (id: string): LayoutDefinition | undefined =>
  layoutRegistry.getLayout(id);

/** Lista layouts con filtros opcionales */
export const listLayouts = (filter?: LayoutFilter): LayoutDefinition[] =>
  layoutRegistry.listLayouts(filter);

/** Lista todas las categorías */
export const listCategories = (): LayoutCategory[] =>
  layoutRegistry.listCategories();

/** Registra un layout nuevo */
export const registerLayout = (def: LayoutDefinition): void =>
  layoutRegistry.registerLayout(def);

/** Elimina un layout del registro */
export const unregisterLayout = (id: string): boolean =>
  layoutRegistry.unregisterLayout(id);

/** Restablece el registro al catálogo por defecto */
export const resetLayouts = (): void => layoutRegistry.resetLayouts();

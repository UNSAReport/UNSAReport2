import { defaultLayouts } from './catalog';
import { LayoutCategory, type LayoutDefinition } from './types';

export interface LayoutFilter {
  category?: LayoutCategory;
  search?: string;
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
   */
  registerLayout(def: LayoutDefinition): void {
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
        `Layout '${id}' no encontrado en LayoutRegistry. Layouts disponibles: [${available}]`
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
          l.tags.some((t) => t.toLowerCase().includes(term))
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

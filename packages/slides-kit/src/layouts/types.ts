import type { ComponentType, ReactNode } from 'react';

/**
 * Familias o categorías funcionales de layouts disponibles.
 */
export const LayoutCategory = {
  HERO: 'hero',
  SPLIT: 'split',
  BENTO: 'bento',
  STATS: 'stats',
  PROCESS: 'process',
  CODE: 'code',
  LIST: 'list',
  QUOTE: 'quote',
  CLOSING: 'closing',
} as const;

export type LayoutCategory =
  (typeof LayoutCategory)[keyof typeof LayoutCategory];

/**
 * Esquema de un slot de contenido requerido u opcional por un layout.
 */
export interface SlotSchema {
  /** Nombre del campo o prop esperado */
  name: string;
  /** Tipo de dato descriptivo (ej: 'string', 'array', 'object', 'code') */
  type: string;
  /** Si el slot es indispensable para renderizar el layout */
  required: boolean;
  /** Guía explicativa del propósito del slot */
  description: string;
}

/**
 * Props estándar que reciben todos los componentes de layout.
 */
export interface BaseLayoutProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal */
  title?: string;
  /** Subtítulo o descripción breve */
  subtitle?: string;
  /** Contenido secundario o libre */
  children?: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Props arbitrarias adicionales del slot */
  [key: string]: any;
}

/**
 * Definición canónica completa de un layout registrado en el catálogo.
 */
export interface LayoutDefinition {
  /** Identificador único en formato kebab-case (ej: 'bento-4-featured-left') */
  id: string;
  /** Nombre legible para mostrar en selectores y catálogos */
  name: string;
  /** Familia funcional a la que pertenece */
  category: LayoutCategory;
  /** Guía de cuándo usar este layout y qué transmite */
  description: string;
  /** Tags temáticos para búsqueda y filtrado */
  tags: string[];
  /** Especificación de los slots aceptados por este layout */
  slots: SlotSchema[];
  /** Componente React que renderiza el layout */
  component: ComponentType<any>;
  /** Ruta o URI de la imagen de previsualización */
  thumbnail?: string;
}

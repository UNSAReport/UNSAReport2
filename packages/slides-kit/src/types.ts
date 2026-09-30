import type { ReactNode } from 'react';

/**
 * Niveles de visibilidad de una presentación
 */
export const PresentationVisibility = {
  PRIVATE: 'private',
  ORG: 'org',
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
} as const;

export type PresentationVisibility =
  (typeof PresentationVisibility)[keyof typeof PresentationVisibility];

/**
 * Transiciones soportadas por Reveal.js
 */
export const SlideTransition = {
  NONE: 'none',
  FADE: 'fade',
  SLIDE: 'slide',
  CONVEX: 'convex',
  CONCAVE: 'concave',
  ZOOM: 'zoom',
} as const;

export type SlideTransition =
  (typeof SlideTransition)[keyof typeof SlideTransition];

/**
 * Definición declarativa de una diapositiva individual
 */
export interface SlideDefinition {
  /** Identificador de layout registrado en LayoutRegistry o 'custom' */
  layout: string;
  /** Etiqueta o badge contextual (ej: 'Introducción', 'Resultados') */
  tag?: string;
  /** Título principal de la diapositiva */
  title?: string;
  /** Subtítulo o texto secundario */
  subtitle?: string;
  /** Notas de orador (Speaker Notes) visibles en el modo orador */
  notes?: string;
  /** Componente React personalizado (cuando layout === 'custom') */
  // biome-ignore lint/suspicious/noExplicitAny: Componentes personalizados aceptan props libres
  component?: React.ComponentType<any>;
  /** Contenido de hijos o slots adicionales */
  children?: ReactNode;
  /** Props y slots dinámicos específicos de cada layout */
  [key: string]: unknown;
}

/**
 * Configuración completa del deck de diapositivas
 */
export interface DeckConfig {
  /** Título de la presentación */
  title: string;
  /** Identificador amigable en la URL (slug [a-z0-9-]{2,100}) */
  slug?: string;
  /** Descripción o resumen de la presentación */
  description?: string;
  /** Identificador del tema visual (default: 'unsa-dark') */
  theme?: string;
  /** Nivel de privacidad y visibilidad */
  visibility?: PresentationVisibility;
  /** Slug de la organización propietaria (vacío para personal) */
  orgSlug?: string;
  /** Estilo de transición entre diapositivas */
  transition?: SlideTransition;
  /** Ancho de resolución base del canvas (default: 1280) */
  width?: number;
  /** Alto de resolución base del canvas (default: 720) */
  height?: number;
  /** Margen porcentual del lienzo (default: 0.04) */
  margin?: number;
  /** Tiempo en milisegundos para auto-avance (0 = deshabilitado) */
  autoSlide?: number;
  /** Si la presentación vuelve al inicio tras la última diapositiva */
  loop?: boolean;
  /** Formato de numeración de diapositivas (default: 'c/t') */
  slideNumber?: 'c/t' | 'c' | false;
  /** Relación de aspecto del lienzo (default: '16:9') */
  aspect?: '16:9' | '4:3' | '16:10';
  /** Si centra verticalmente las diapositivas (default: false) */
  center?: boolean;
  /** Si muestra los controles de navegación (default: true) */
  controls?: boolean;
  /** Si muestra la barra de progreso (default: true) */
  progress?: boolean;
  /** Si sincroniza la diapositiva actual con el hash de la URL (default: true) */
  hash?: boolean;
  /** Diapositivas que componen la presentación */
  slides: SlideDefinition[];
}

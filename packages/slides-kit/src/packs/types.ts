import type { ComponentType } from 'react';
import type { SlotSchema } from '@/layouts/types';
import type { ThemeDefinition } from '@/themes/types';

/**
 * Slide individual perteneciente a un TemplatePack.
 * Su id es local al pack ('cover', 'agenda', 'team', …).
 */
export interface TemplateSlide {
  /** Identificador único dentro del pack (kebab-case, sin prefijo de pack) */
  id: string;
  /** Nombre legible */
  name: string;
  /** Descripción del propósito de la slide */
  description: string;
  /** Slots de datos que acepta el componente */
  slots: SlotSchema[];
  /** Componente React que renderiza la slide */
  // biome-ignore lint/suspicious/noExplicitAny: Los slides de pack aceptan props polimórficas según su SlotSchema
  component: ComponentType<any>;
  /** Ruta o URI de la imagen de previsualización */
  thumbnail?: string;
}

/**
 * Unidad atómica de plantilla: agrupa un tema visual y sus slides de
 * plantilla. Es independiente del LayoutRegistry global.
 *
 * Registrar un pack con registerPack() es suficiente para que su tema
 * y sus slides queden disponibles en el sistema.
 */
export interface TemplatePack {
  /** Identificador único del pack en kebab-case (e.g. 'cloudlet-pitch') */
  id: string;
  /** Nombre legible para selectores y galerías */
  name: string;
  /** Descripción y contexto de uso del pack */
  description: string;
  /** Tags para búsqueda y filtrado */
  tags: string[];
  /** Definición visual del tema (estilos puros — sin referencias a layouts) */
  theme: ThemeDefinition;
  /** Slides de plantilla incluidas en el pack */
  slides: TemplateSlide[];
  /** Ruta o URI del thumbnail de previsualización del pack */
  thumbnail?: string;
  /** Metadatos opcionales de origen */
  meta?: {
    source?: 'pptx' | 'figma' | 'scratch';
    author?: string;
    version?: string;
  };
}

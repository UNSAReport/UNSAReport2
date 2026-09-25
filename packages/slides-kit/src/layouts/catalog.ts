import { Bento4FeaturedLeft } from './bento/bento-4-featured-left';
import { ClosingQACentered } from './closing/closing-qa-centered';
import { CodeFullscreen } from './code/code-fullscreen';
import { HeroCenteredBold } from './hero/hero-centered-bold';
import { ListBulletCards } from './list/list-bullet-cards';
import { ProcessHorizontal3 } from './process/process-horizontal-3';
import { QuoteCenteredLarge } from './quote/quote-centered-large';
import { Split5050Text } from './split/split-50-50-text';
import { Stats3Row } from './stats/stats-3-row';
import { LayoutCategory, type LayoutDefinition } from './types';

/**
 * Catálogo central de layouts preinstalados en @unsa/slides-kit.
 */
export const defaultLayouts: LayoutDefinition[] = [
  // 1. HERO
  {
    id: 'hero-centered-bold',
    name: 'Hero Centrado Bold',
    category: LayoutCategory.HERO,
    description:
      'Portada imponente con título gigante centrado, subtítulo, autor y fecha. Ideal para abrir presentaciones oficiales o de laboratorio.',
    tags: ['portada', 'título', 'hero', 'centrado'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título principal' },
      { name: 'subtitle', type: 'string', required: false, description: 'Subtítulo descriptivo' },
      { name: 'tag', type: 'string', required: false, description: 'Insignia superior' },
      { name: 'author', type: 'string', required: false, description: 'Autor(es)' },
      { name: 'date', type: 'string', required: false, description: 'Fecha o evento' },
    ],
    component: HeroCenteredBold,
  },

  // 2. SPLIT
  {
    id: 'split-50-50-text',
    name: 'Split 50/50 Texto',
    category: LayoutCategory.SPLIT,
    description:
      'Dos columnas simétricas balanceadas para contrastar dos ideas, enfoques o tecnologías en tarjetas independientes.',
    tags: ['comparación', 'dos columnas', 'split', '50/50'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título de la diapositiva' },
      { name: 'leftTitle', type: 'string', required: false, description: 'Título columna izquierda' },
      { name: 'leftContent', type: 'string', required: true, description: 'Contenido columna izquierda' },
      { name: 'rightTitle', type: 'string', required: false, description: 'Título columna derecha' },
      { name: 'rightContent', type: 'string', required: true, description: 'Contenido columna derecha' },
    ],
    component: Split5050Text,
  },

  // 3. BENTO
  {
    id: 'bento-4-featured-left',
    name: 'Bento 4 Celdas con Destacado Izquierdo',
    category: LayoutCategory.BENTO,
    description:
      'Composición asimétrica estilo Bento Grid con tarjeta destacada a la izquierda y tres secundarias a la derecha.',
    tags: ['bento', 'dashboard', 'métricas', 'grid asimétrico'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título del bloque bento' },
      { name: 'featured', type: 'object', required: true, description: 'Tarjeta destacada izquierda con métrica' },
      { name: 'cards', type: 'array', required: true, description: 'Arreglo de hasta 3 tarjetas secundarias' },
    ],
    component: Bento4FeaturedLeft,
  },

  // 4. STATS
  {
    id: 'stats-3-row',
    name: 'Estadísticas 3 en Fila',
    category: LayoutCategory.STATS,
    description:
      'Tres tarjetas con números gigantes para resaltar KPIs, volumen de datos, porcentajes de éxito o benchmarks.',
    tags: ['kpi', 'métricas', 'estadísticas', 'números'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título de la diapositiva' },
      { name: 'stats', type: 'array', required: true, description: 'Lista de 3 objetos { number, label, change, description }' },
    ],
    component: Stats3Row,
  },

  // 5. PROCESS
  {
    id: 'process-horizontal-3',
    name: 'Proceso Horizontal 3 Pasos',
    category: LayoutCategory.PROCESS,
    description:
      'Línea de tiempo horizontal de 3 etapas secuenciales conectadas con numeración circular destacada.',
    tags: ['proceso', 'timeline', 'etapas', 'pasos'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título del proceso' },
      { name: 'steps', type: 'array', required: true, description: 'Lista de 3 pasos { step, title, description }' },
    ],
    component: ProcessHorizontal3,
  },

  // 6. CODE
  {
    id: 'code-fullscreen',
    name: 'Código Pantalla Completa',
    category: LayoutCategory.CODE,
    description:
      'Visor de código estilo ventana de editor moderno con barra de control, lenguaje y filename.',
    tags: ['código', 'desarrollo', 'terminal', 'snippet'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título de la diapositiva' },
      { name: 'code', type: 'string', required: true, description: 'Snippet de código a mostrar' },
      { name: 'language', type: 'string', required: false, description: 'Lenguaje de programación' },
      { name: 'filename', type: 'string', required: false, description: 'Nombre del archivo fuente' },
    ],
    component: CodeFullscreen,
  },

  // 7. LIST
  {
    id: 'list-bullet-cards',
    name: 'Lista de Tarjetas con Viñetas',
    category: LayoutCategory.LIST,
    description:
      'Cuadrícula de tarjetas con viñetas estilizadas o íconos para presentar agendas, requerimientos o características.',
    tags: ['lista', 'agenda', 'viñetas', 'cards'],
    slots: [
      { name: 'title', type: 'string', required: true, description: 'Título de la lista' },
      { name: 'items', type: 'array', required: true, description: 'Lista de elementos { title, description, icon }' },
    ],
    component: ListBulletCards,
  },

  // 8. QUOTE
  {
    id: 'quote-centered-large',
    name: 'Cita Centrada Impactante',
    category: LayoutCategory.QUOTE,
    description:
      'Cita textual grande centrada con comillas estilizadas, autor y afiliación para marcar pausas reflexivas.',
    tags: ['cita', 'quote', 'reflexión', 'autor'],
    slots: [
      { name: 'quote', type: 'string', required: true, description: 'Texto de la cita' },
      { name: 'author', type: 'string', required: true, description: 'Autor de la cita' },
      { name: 'role', type: 'string', required: false, description: 'Cargo o afiliación del autor' },
    ],
    component: QuoteCenteredLarge,
  },

  // 9. CLOSING
  {
    id: 'closing-qa-centered',
    name: 'Cierre Q&A Centrado',
    category: LayoutCategory.CLOSING,
    description:
      'Diapositiva final con llamado a preguntas, agradecimiento institucional y tarjeta de datos de contacto.',
    tags: ['cierre', 'preguntas', 'qa', 'contacto', 'gracias'],
    slots: [
      { name: 'title', type: 'string', required: false, description: 'Título de cierre (default: ¿Preguntas?)' },
      { name: 'subtitle', type: 'string', required: false, description: 'Mensaje de agradecimiento' },
      { name: 'contactEmail', type: 'string', required: false, description: 'Correo de contacto' },
      { name: 'contactUrl', type: 'string', required: false, description: 'Enlace web o repositorio' },
    ],
    component: ClosingQACentered,
  },
];

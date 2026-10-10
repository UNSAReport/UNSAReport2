import type { TemplatePack } from '@/packs/types';
import { harperMinimalTheme } from './theme';
import { HarperCover } from './slides/cover';
import { HarperContents } from './slides/contents';
import { HarperStats } from './slides/stats';
import { HarperProblem } from './slides/problem';
import { HarperSolution } from './slides/solution';
import { HarperMarketOpportunity } from './slides/market-opportunity';
import { HarperWhyNow } from './slides/why-now';
import { HarperProductOverview } from './slides/product-overview';
import { HarperFeatures } from './slides/features';
import { HarperBusinessModel } from './slides/business-model';
import { HarperRoadmapQuarters } from './slides/roadmap-quarters';
import { HarperClosing } from './slides/closing';

export const harperMinimalPack: TemplatePack = {
  id: 'harper-minimal',
  name: 'Harper Minimal',
  description: 'Pitch minimalista en negro y rojo coral.',
  tags: ['pitch', 'minimalist', 'harper', 'imported'],
  theme: harperMinimalTheme,
  meta: { source: 'pptx' },
  slides: [
    {
      id: 'cover',
      name: 'Harper Cover',
      description: 'Portada minimalista con textura de grano coral',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de portada"},{"name":"subtitle","type":"string","required":false,"description":"Subtítulo o nombre de compañía"},{"name":"brand","type":"string","required":false,"description":"Marca o firma inferior"}],
      component: HarperCover,
    },
    {
      id: 'contents',
      name: 'Harper Contents',
      description: 'Tabla de contenidos con numerales fantasma',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la tabla de contenidos"},{"name":"items","type":"array","required":false,"description":"Entradas del índice ({label, page})"}],
      component: HarperContents,
    },
    {
      id: 'stats',
      name: 'Harper Stats',
      description: 'Tres estadísticas con numerales grandes',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"description","type":"string","required":false,"description":"Párrafo descriptivo editorial"},{"name":"stats","type":"array","required":false,"description":"Estadísticas ({value, label, iconSrc})"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperStats,
    },
    {
      id: 'problem',
      name: 'Harper Problem',
      description: 'El problema con texto editorial',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"tagline","type":"string","required":false,"description":"Línea destacada en coral"},{"name":"description","type":"string","required":false,"description":"Párrafo descriptivo editorial"},{"name":"photoSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperProblem,
    },
    {
      id: 'solution',
      name: 'Harper Solution',
      description: 'Nuestra solución con descripción de plataforma',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"heading","type":"string","required":false,"description":"Encabezado editorial sobre la tarjeta"},{"name":"description","type":"string","required":false,"description":"Párrafo descriptivo editorial"},{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperSolution,
    },
    {
      id: 'market-opportunity',
      name: 'Harper Market Opportunity',
      description: 'Oportunidad de mercado con visual',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"items","type":"array","required":false,"description":"Segmentos de mercado ({caption, imageSrc})"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperMarketOpportunity,
    },
    {
      id: 'why-now',
      name: 'Harper Why Now',
      description: 'Por qué ahora con razones temporales',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"heading","type":"string","required":false,"description":"Encabezado editorial lateral"},{"name":"description","type":"string","required":false,"description":"Párrafo descriptivo editorial"},{"name":"stripSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperWhyNow,
    },
    {
      id: 'product-overview',
      name: 'Harper Product Overview',
      description: 'Resumen de producto con visual',
      slots: [{"name":"tag","type":"string","required":false,"description":"Etiqueta superior en mayúsculas"},{"name":"description","type":"string","required":false,"description":"Párrafo descriptivo editorial"},{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperProductOverview,
    },
    {
      id: 'features',
      name: 'Harper Features',
      description: 'Características clave en tarjetas',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"intro","type":"string","required":false,"description":"Párrafo introductorio lateral"},{"name":"features","type":"array","required":false,"description":"Características ({label, iconSrc})"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperFeatures,
    },
    {
      id: 'business-model',
      name: 'Harper Business Model',
      description: 'Modelo de negocio',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"intro","type":"string","required":false,"description":"Párrafo introductorio superior"},{"name":"columns","type":"array","required":false,"description":"Columnas del modelo ({heading, body})"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperBusinessModel,
    },
    {
      id: 'roadmap-quarters',
      name: 'Harper Roadmap Quarters',
      description: 'Hoja de ruta por trimestres',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de la sección"},{"name":"quarters","type":"array","required":false,"description":"Trimestres ({quarter, bullets}) con prefijo \"•  \" incluido"},{"name":"pageNumber","type":"string","required":false,"description":"Numeral fantasma de página"}],
      component: HarperRoadmapQuarters,
    },
    {
      id: 'closing',
      name: 'Harper Closing',
      description: 'Cierre minimalista espejo de portada',
      slots: [{"name":"title","type":"string","required":false,"description":"Título principal de cierre"},{"name":"subtitle","type":"string","required":false,"description":"Subtítulo o nombre de compañía"},{"name":"brand","type":"string","required":false,"description":"Marca o firma inferior"}],
      component: HarperClosing,
    },
  ],
};
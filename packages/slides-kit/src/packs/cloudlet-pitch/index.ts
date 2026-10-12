import type { TemplatePack } from '@/packs/types';
import { cloudletPitchTheme } from './theme';
import { CloudletCover } from './slides/cover';
import { CloudletAgenda } from './slides/agenda';
import { CloudletIntroduction } from './slides/introduction';
import { CloudletProblemStatement } from './slides/problem-statement';
import { CloudletInnovativeSolutions } from './slides/innovative-solutions';
import { CloudletServices } from './slides/services';
import { CloudletMarketSize } from './slides/market-size';
import { CloudletCompetitors } from './slides/competitors';
import { CloudletAdvantages } from './slides/advantages';
import { CloudletTraction } from './slides/traction';
import { CloudletAccomplishments } from './slides/accomplishments';
import { CloudletUseOfFunds } from './slides/use-of-funds';
import { CloudletTeam } from './slides/team';
import { CloudletThankYou } from './slides/thank-you';

export const cloudletPitchPack: TemplatePack = {
  id: 'cloudlet-pitch',
  name: 'Cloudlet Pitch',
  description: 'Pitch claro de startup Cloudlet Tech con lavados grises y oscuros alternados.',
  tags: ['pitch', 'startup', 'cloudlet', 'imported'],
  theme: cloudletPitchTheme,
  meta: { source: 'pptx' },
  slides: [
    {
      id: 'cover',
      name: 'Cloudlet Cover',
      description: 'Portada pitch startup con panel degradado y foto',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'heroTitle', type: 'string', required: false, description: 'Titular gigante de portada' },
        { name: 'subtitle', type: 'string', required: false, description: 'Subtítulo de presentación' },
        { name: 'presentedLabel', type: 'string', required: false, description: 'Etiqueta de presentador' },
        { name: 'presenter', type: 'string', required: false, description: 'Nombre del presentador' },
      ],
      component: CloudletCover,
    },
    {
      id: 'agenda',
      name: 'Cloudlet Agenda',
      description: 'Agenda del día con puntos numerados',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'title', type: 'string', required: false, description: 'Título de la agenda' },
        { name: 'items', type: 'array', required: false, description: 'Puntos de la agenda con número y etiqueta' },
      ],
      component: CloudletAgenda,
    },
    {
      id: 'introduction',
      name: 'Cloudlet Introduction',
      description: 'Introducción de la empresa con foto',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'bodyLeft', type: 'string', required: false, description: 'Párrafo de la columna izquierda' },
        { name: 'bodyRight', type: 'string', required: false, description: 'Párrafo de la columna derecha' },
        { name: 'photoSrc', type: 'string', required: false, description: 'URL de imagen (default: asset de la plantilla)' },
      ],
      component: CloudletIntroduction,
    },
    {
      id: 'problem-statement',
      name: 'Cloudlet Problem Statement',
      description: 'Tres problemas en tarjetas',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'problems', type: 'array', required: false, description: 'Tres problemas con título y descripción' },
      ],
      component: CloudletProblemStatement,
    },
    {
      id: 'innovative-solutions',
      name: 'Cloudlet Innovative Solutions',
      description: 'Tres soluciones innovadoras en tarjetas',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'solutions', type: 'array', required: false, description: 'Tres soluciones con título y descripción' },
      ],
      component: CloudletInnovativeSolutions,
    },
    {
      id: 'services',
      name: 'Cloudlet Services',
      description: 'Cuatro servicios con iconos',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'services', type: 'array', required: false, description: 'Cuatro servicios con número, título y descripción' },
      ],
      component: CloudletServices,
    },
    {
      id: 'market-size',
      name: 'Cloudlet Market Size',
      description: 'Tamaño de mercado con métricas destacadas',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'description', type: 'string', required: false, description: 'Párrafo descriptivo del mercado' },
        { name: 'highlightValue', type: 'string', required: false, description: 'Métrica principal destacada' },
        { name: 'highlightCaption', type: 'string', required: false, description: 'Leyenda de la métrica principal' },
        { name: 'metricValue', type: 'string', required: false, description: 'Métrica secundaria en gráfico' },
        { name: 'metricCaption', type: 'string', required: false, description: 'Leyenda de la métrica secundaria' },
        { name: 'graphicSrc', type: 'string', required: false, description: 'URL de imagen (default: asset de la plantilla)' },
      ],
      component: CloudletMarketSize,
    },
    {
      id: 'competitors',
      name: 'Cloudlet Competitors',
      description: 'Competidores directos e indirectos',
      slots: [
        { name: 'directTitle', type: 'string', required: false, description: 'Título de la columna directa' },
        { name: 'indirectTitle', type: 'string', required: false, description: 'Título de la columna indirecta' },
        { name: 'directPoints', type: 'array', required: false, description: 'Puntos de competidores directos' },
        { name: 'indirectPoints', type: 'array', required: false, description: 'Puntos de competidores indirectos' },
      ],
      component: CloudletCompetitors,
    },
    {
      id: 'advantages',
      name: 'Cloudlet Advantages',
      description: 'Ventajas competitivas clave',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'advantages', type: 'array', required: false, description: 'Tres ventajas con título y descripción' },
        { name: 'photoSrc', type: 'string', required: false, description: 'URL de imagen (default: asset de la plantilla)' },
      ],
      component: CloudletAdvantages,
    },
    {
      id: 'traction',
      name: 'Cloudlet Traction',
      description: 'Tracción con métricas de crecimiento',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'description', type: 'string', required: false, description: 'Párrafo descriptivo de la tracción' },
        { name: 'metrics', type: 'array', required: false, description: 'Tres métricas de crecimiento' },
        { name: 'chartSrc', type: 'string', required: false, description: 'URL de imagen (default: asset de la plantilla)' },
      ],
      component: CloudletTraction,
    },
    {
      id: 'accomplishments',
      name: 'Cloudlet Accomplishments',
      description: 'Logros por año en línea temporal',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'milestones', type: 'array', required: false, description: 'Cuatro hitos con año y descripción' },
      ],
      component: CloudletAccomplishments,
    },
    {
      id: 'use-of-funds',
      name: 'Cloudlet Use Of Funds',
      description: 'Uso de fondos con desglose',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'description', type: 'string', required: false, description: 'Párrafo descriptivo del uso de fondos' },
        { name: 'points', type: 'array', required: false, description: 'Cuatro partidas del desglose' },
        { name: 'chartSrc', type: 'string', required: false, description: 'URL de imagen (default: asset de la plantilla)' },
      ],
      component: CloudletUseOfFunds,
    },
    {
      id: 'team',
      name: 'Cloudlet Team',
      description: 'Equipo con fotos y roles',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'title', type: 'string', required: false, description: 'Título de la sección' },
        { name: 'description', type: 'string', required: false, description: 'Párrafo descriptivo del equipo' },
        { name: 'members', type: 'array', required: false, description: 'Cuatro miembros con nombre y foto' },
      ],
      component: CloudletTeam,
    },
    {
      id: 'thank-you',
      name: 'Cloudlet Thank You',
      description: 'Cierre de agradecimiento',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup en cabecera' },
        { name: 'presentedLabel', type: 'string', required: false, description: 'Etiqueta de presentador' },
        { name: 'presenter', type: 'string', required: false, description: 'Nombre del presentador' },
        { name: 'title', type: 'string', required: false, description: 'Titular de agradecimiento' },
        { name: 'subtitle', type: 'string', required: false, description: 'Línea de cierre' },
        { name: 'contacts', type: 'array', required: false, description: 'Cuatro datos de contacto' },
      ],
      component: CloudletThankYou,
    },
  ],
};

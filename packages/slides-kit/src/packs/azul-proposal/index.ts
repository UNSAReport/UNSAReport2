import type { TemplatePack } from '@/packs/types';
import { azulProposalTheme } from './theme';
import { AzulCoverDuo } from './slides/cover-duo';
import { AzulMarketOpportunity } from './slides/market-opportunity';
import { AzulProblemStatement } from './slides/problem-statement';
import { AzulOurSolution } from './slides/our-solution';
import { AzulValueProposition } from './slides/value-proposition';
import { AzulTargetAudience } from './slides/target-audience';
import { AzulCompetitiveAnalysis } from './slides/competitive-analysis';
import { AzulMarketingStrategy } from './slides/marketing-strategy';
import { AzulImplementationPlan } from './slides/implementation-plan';
import { AzulConclusionNextSteps } from './slides/conclusion-next-steps';
import { AzulThankYou } from './slides/thank-you';

export const azulProposalPack: TemplatePack = {
  id: 'azul-proposal',
  name: 'Azul Proposal',
  description: 'Propuesta de negocio sobre azul corporativo profundo.',
  tags: ['proposal', 'business', 'azul', 'imported'],
  theme: azulProposalTheme,
  meta: { source: 'pptx' },
  slides: [
    {
      id: 'cover-duo',
      name: 'Azul Cover Duo',
      description: 'Portada de propuesta con doble línea apilada, foto y franja de pie dual',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"logoSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"titleTop","type":"string","required":false,"description":"Línea superior del titular"},{"name":"titleBottom","type":"string","required":false,"description":"Línea inferior del titular"},{"name":"siteUrl","type":"string","required":false,"description":"URL del sitio en la franja de pie"},{"name":"companyLabel","type":"string","required":false,"description":"Etiqueta de compañía junto al logo"}],
      component: AzulCoverDuo,
    },
    {
      id: 'market-opportunity',
      name: 'Azul Market Opportunity',
      description: 'Oportunidad de mercado con numerales 01/02 y foto lateral',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"photoSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"items","type":"array","required":false,"description":"Puntos de oportunidad ({ numeral, body })"}],
      component: AzulMarketOpportunity,
    },
    {
      id: 'problem-statement',
      name: 'Azul Problem Statement',
      description: 'Planteamiento del problema con tarjetas numeradas 01-03',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"intro","type":"array","required":false,"description":"Párrafos de introducción (dos)"},{"name":"cards","type":"array","required":false,"description":"Tarjetas numeradas 01-03 ({ numeral, body })"}],
      component: AzulProblemStatement,
    },
    {
      id: 'our-solution',
      name: 'Azul Our Solution',
      description: 'Nuestra solución con línea de tiempo vertical 01-03',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"intro","type":"array","required":false,"description":"Párrafos de introducción (dos)"},{"name":"steps","type":"array","required":false,"description":"Pasos de la línea de tiempo vertical 01-03 ({ numeral, body })"}],
      component: AzulOurSolution,
    },
    {
      id: 'value-proposition',
      name: 'Azul Value Proposition',
      description: 'Propuesta de valor con 4 hitos sobre línea horizontal',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"milestones","type":"array","required":false,"description":"Cuatro hitos sobre la línea horizontal ({ numeral, body })"}],
      component: AzulValueProposition,
    },
    {
      id: 'target-audience',
      name: 'Azul Target Audience',
      description: 'Audiencia objetivo con 4 tarjetas de segmentos',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"intro","type":"array","required":false,"description":"Párrafos de introducción (dos)"},{"name":"segments","type":"array","required":false,"description":"Cuatro tarjetas de segmentos de audiencia ({ numeral, body })"}],
      component: AzulTargetAudience,
    },
    {
      id: 'competitive-analysis',
      name: 'Azul Competitive Analysis',
      description: 'Análisis competitivo con foto y panel de texto',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"intro","type":"array","required":false,"description":"Párrafos de introducción (dos)"}],
      component: AzulCompetitiveAnalysis,
    },
    {
      id: 'marketing-strategy',
      name: 'Azul Marketing Strategy',
      description: 'Estrategia de marketing y ventas con foto lateral',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"photoSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"intro","type":"array","required":false,"description":"Párrafos de introducción (dos)"}],
      component: AzulMarketingStrategy,
    },
    {
      id: 'implementation-plan',
      name: 'Azul Implementation Plan',
      description: 'Plan de implementación centrado',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"photoSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"intro","type":"array","required":false,"description":"Párrafos de introducción (dos)"}],
      component: AzulImplementationPlan,
    },
    {
      id: 'conclusion-next-steps',
      name: 'Azul Conclusion Next Steps',
      description: 'Conclusión y próximos pasos',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"title","type":"string","required":false,"description":"Título principal"},{"name":"paragraphs","type":"array","required":false,"description":"Párrafos de cuerpo (dos)"}],
      component: AzulConclusionNextSteps,
    },
    {
      id: 'thank-you',
      name: 'Azul Thank You',
      description: 'Cierre de agradecimiento espejo de portada',
      slots: [{"name":"backgroundSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"logoSrc","type":"string","required":false,"description":"URL de imagen (default: asset de la plantilla)"},{"name":"titleTop","type":"string","required":false,"description":"Línea superior del titular"},{"name":"titleBottom","type":"string","required":false,"description":"Línea inferior del titular"},{"name":"siteUrl","type":"string","required":false,"description":"URL del sitio en la franja de pie"},{"name":"companyLabel","type":"string","required":false,"description":"Etiqueta de compañía junto al logo"}],
      component: AzulThankYou,
    },
  ],
};
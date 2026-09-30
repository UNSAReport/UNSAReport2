/**
 * Muestras planas de vista previa por layout id.
 *
 * Cada entrada cubre los props requeridos del componente (los opcionales
 * tag/title/subtitle se inyectan en el render desde la definición).
 * Generado a partir de las interfaces *Props del kit (K2-2): los arrays
 * están acotados (<=3 elementos) para la miniatura del catálogo.
 */
export const previewSamples: Record<string, Record<string, unknown>> = {
  'bento-1-wide-2-stacked': {
    topLeftTitle: 'Enfoque A',
    topLeftContent: 'Resumen del primer enfoque.',
    topRightTitle: 'Enfoque B',
    topRightContent: 'Resumen del segundo enfoque.',
    bottomWideTitle: 'Síntesis',
    bottomWideContent: 'Conclusión que integra ambos enfoques.',
  },
  'bento-2-wide-1-tall': {
    topWideTitle: 'Visión general',
    topWideContent: 'Contexto del sistema analizado.',
    bottomWideTitle: 'Resultados',
    bottomWideContent: 'Hallazgos principales del estudio.',
    tallTitle: 'Métrica clave',
    tallContent: '99.9% de disponibilidad.',
  },
  'bento-2x2-equal': {
    cards: [
      { title: 'Módulo 1', content: 'Descripción del módulo 1.' },
      { title: 'Módulo 2', content: 'Descripción del módulo 2.' },
      { title: 'Módulo 3', content: 'Descripción del módulo 3.' },
    ],
  },
  'bento-3-horizontal': {
    columns: [
      { title: 'Entrada', content: 'Datos de origen.' },
      { title: 'Proceso', content: 'Transformación aplicada.' },
      { title: 'Salida', content: 'Resultado esperado.' },
    ],
  },
  'bento-3-vertical': {
    rows: [
      { title: 'Fase 1', content: 'Planificación del estudio.' },
      { title: 'Fase 2', content: 'Ejecución controlada.' },
      { title: 'Fase 3', content: 'Evaluación de resultados.' },
    ],
  },
  'bento-4-featured-left': {
    featured: {
      stat: '1.2M',
      label: 'Operaciones',
      description: 'Por segundo',
    },
    cards: [
      { title: 'Latencia', stat: '42ms' },
      { title: 'Uptime', stat: '99.9%' },
    ],
  },
  'bento-4-featured-top': {
    featuredTitle: 'Hallazgo principal',
    featuredContent: 'El rendimiento mejora 3x con la nueva arquitectura.',
    bottomCards: [
      { title: 'Latencia', description: '42ms por petición.' },
      { title: 'Uptime', description: '99.9% en producción.' },
    ],
  },
  'bento-5-mosaic': {
    largeCard: { title: 'Núcleo', content: 'Componente central del sistema.' },
    smallCards: [
      { title: 'API', content: 'Interfaz de servicios.' },
      { title: 'Cache', content: 'Capa de aceleración.' },
    ],
    bottomCards: [
      { title: 'Cola', content: 'Procesamiento diferido.' },
      { title: 'Logs', content: 'Observabilidad total.' },
    ],
  },
  'bento-6-grid': {
    cards: [
      { title: 'Auth', content: 'Autenticación segura.' },
      { title: 'API', content: 'Servicios REST.' },
      { title: 'DB', content: 'Persistencia relacional.' },
    ],
  },
  'bento-cross': {
    center: { title: 'Núcleo', content: 'Lógica central.' },
    top: { title: 'Entrada', content: 'Datos de origen.' },
    bottom: { title: 'Salida', content: 'Resultado final.' },
    left: { title: 'Control', content: 'Supervisión.' },
    right: { title: 'Soporte', content: 'Infraestructura.' },
  },
  'bento-dashboard': {
    metrics: [
      { label: 'Latencia', value: '42ms' },
      { label: 'Uptime', value: '99.9%' },
    ],
    chartTitle: 'Tendencia semanal',
    chartContent: 'Evolución estable del rendimiento.',
    activityTitle: 'Actividad reciente',
    activities: ['Deploy v2.3', 'Migración DB'],
  },
  'bento-diagonal': {
    topLeft: { title: 'Origen', content: 'Estado inicial.' },
    topRight: { title: 'Contexto', content: 'Condiciones previas.' },
    bottomLeft: { title: 'Proceso', content: 'Transformación.' },
    bottomRight: { title: 'Meta', content: 'Estado objetivo.' },
  },
  'bento-footer-grid': {
    gridCards: [
      { title: 'Módulo A', content: 'Descripción A.' },
      { title: 'Módulo B', content: 'Descripción B.' },
    ],
    footerTitle: 'Conclusión',
    footerContent: 'Síntesis de los módulos presentados.',
  },
  'bento-header-grid': {
    headerTitle: 'Panorama',
    headerContent: 'Resumen ejecutivo del sistema.',
    gridCards: [
      { title: 'Módulo A', content: 'Descripción A.' },
      { title: 'Módulo B', content: 'Descripción B.' },
    ],
  },
  'bento-hero-sidebar': {
    heroTitle: 'Plataforma UNSA',
    heroContent: 'Sistema académico integrado.',
    sidebarTop: { title: 'Uptime', content: '99.9%' },
    sidebarBottom: { title: 'Usuarios', content: '12k activos' },
  },
  'bento-l-shape': {
    tallLeft: { title: 'Eje', content: 'Columna vertebral.' },
    topRight: { title: 'Complemento', content: 'Apoyo lateral.' },
    bottomWide: { title: 'Base', content: 'Fundamento común.' },
  },
  'bento-magazine': {
    headline: 'La tesis defiende una arquitectura limpia',
    article: 'El estudio demuestra mejoras medibles en tres ejes.',
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    quoteAuthor: 'E. Dijkstra',
    statNumber: '3x',
    statLabel: 'Mejora de rendimiento',
    sideNote: 'Edición especial de investigación.',
  },
  'bento-pyramid': {
    apex: { title: 'Meta', content: 'Objetivo final.' },
    middle: [
      { title: 'Estrategia A', content: 'Primer pilar.' },
      { title: 'Estrategia B', content: 'Segundo pilar.' },
    ],
    base: [
      { title: 'Base 1', content: 'Fundamento operativo.' },
      { title: 'Base 2', content: 'Fundamento técnico.' },
    ],
  },
  'bento-sidebar-main': {
    sidebarTitle: 'Índice',
    sidebarContent: 'Guía de la sección.',
    mainTopTitle: 'Contexto',
    mainTopContent: 'Situación actual del proyecto.',
    mainBottomLeftTitle: 'Riesgos',
    mainBottomLeftContent: 'Mitigaciones previstas.',
    mainBottomRightTitle: 'Oportunidades',
    mainBottomRightContent: 'Ventanas de mejora.',
  },
  'bento-t-shape': {
    headerCard: { title: 'Visión', content: 'Dirección general.' },
    stemCard: { title: 'Eje', content: 'Desarrollo central.' },
    flankLeft: { title: 'Apoyo A', content: 'Recursos.' },
    flankRight: { title: 'Apoyo B', content: 'Alianzas.' },
  },
  'closing-contact-card': {
    name: 'Dra. María Torres',
    role: 'Asesora de tesis',
    channels: [
      { label: 'Email', value: 'mtorres@unsa.edu.pe' },
      { label: 'Oficina', value: 'EPIS-204' },
    ],
  },
  'closing-credits-scroll': {
    groups: [{ category: 'Autores', members: ['J. Pérez', 'A. Quispe'] }],
  },
  'closing-cta-centered': {
    actionText: 'Descargar memoria',
  },
  'closing-next-steps': {
    steps: [{ phase: 'Fase 1', action: 'Publicar resultados' }],
  },
  'closing-qa-centered': {},
  'closing-summary-3-points': {
    points: [
      { title: 'Hallazgo 1', description: 'Mejora de latencia.' },
      { title: 'Hallazgo 2', description: 'Reducción de costos.' },
    ],
  },
  'closing-thank-you': {},
  'code-annotated': {
    code: 'const deck = defineConfig({ theme: "unsa-dark" });',
    annotations: [
      { callout: 1, label: 'Tema', explanation: 'Paleta institucional.' },
    ],
  },
  'code-api-endpoint': {
    method: 'GET',
    path: '/api/presentations/:id',
    description: 'Obtiene una presentación por id.',
    responsePayload: '{ "id": "deck-01" }',
  },
  'code-architecture-stack': {
    code: 'bun run build',
    layers: [
      {
        layer: 'Presentación',
        technologies: ['React', 'Tailwind'],
        description: 'Interfaz del deck.',
      },
    ],
  },
  'code-diff': {
    originalCode: 'const x = 1;',
    modifiedCode: 'const x = 2;',
  },
  'code-fullscreen': {
    code: 'const deck = defineConfig({ theme: "unsa-dark" });',
  },
  'code-snippet-gallery': {
    snippets: [
      {
        title: 'Config',
        language: 'ts',
        code: 'defineConfig({ theme: "unsa-dark" })',
      },
    ],
  },
  'code-split-terminal': {
    code: 'bun run build',
    commands: [{ command: 'bun run build', output: '✓ Ready in 42ms' }],
  },
  'code-step-by-step': {
    steps: [{ step: 1, label: 'Base', code: 'const x = 1;', note: 'Inicial.' }],
  },
  'code-tabs': {
    tabs: [
      { id: 'ts', label: 'TypeScript', language: 'ts', code: 'const x = 1;' },
    ],
  },
  'code-with-output': {
    code: 'console.log("hola")',
    output: 'hola',
  },
  'hero-centered-bold': {},
  'hero-centered-subtitle': {
    subtitle: 'Subtítulo explicativo amplio de la portada.',
  },
  'hero-event-card': {
    eventDate: '12 de octubre, 2026',
    speaker: 'Dra. María Torres',
  },
  'hero-full-image': {},
  'hero-gradient-accent': {},
  'hero-institutional': {
    author: 'J. Pérez — EPIS',
  },
  'hero-kpi-banner': {
    kpiNumber: '99.9%',
    kpiLabel: 'Disponibilidad',
  },
  'hero-minimal': {},
  'hero-split-image': {},
  'hero-two-line': {
    line1: 'Sistemas Distribuidos',
    line2: 'en la UNSA',
  },
  'list-agenda-badges': {
    items: [
      { timeSlot: '09:00', topic: 'Apertura', speaker: 'Decanato' },
      { timeSlot: '09:30', topic: 'Resultados', speaker: 'EPIS' },
    ],
  },
  'list-bullet-cards': {
    items: [
      { title: 'Objetivo', description: 'Meta del estudio.' },
      { title: 'Alcance', description: 'Límites del trabajo.' },
    ],
  },
  'list-checklist': {
    items: [
      { task: 'Revisar metodología', status: 'completed' },
      { task: 'Validar datos', status: 'in-progress' },
    ],
  },
  'list-definition-terms': {
    terms: [{ term: 'SLO', definition: 'Objetivo de nivel de servicio.' }],
  },
  'list-hierarchy-tree': {
    nodes: [{ category: 'Infraestructura', childrenItems: ['Red', 'Cómputo'] }],
  },
  'list-icon-items': {
    items: [{ icon: '◆', title: 'Núcleo', description: 'Lógica central.' }],
  },
  'list-numbered-vertical': {
    items: [{ number: 1, title: 'Plan', description: 'Diseño del estudio.' }],
  },
  'list-pros-cons-columns': {
    columns: [
      {
        title: 'Ventajas',
        points: [{ text: 'Escalable', isPro: true }],
      },
    ],
  },
  'list-pyramid': {
    levels: [
      { level: 'Cúspide', description: 'Meta.', percentageWidth: '40%' },
    ],
  },
  'list-timeline-vertical': {
    events: [
      { date: '2025', title: 'Inicio', description: 'Línea base.' },
      { date: '2026', title: 'Cierre', description: 'Resultados.' },
    ],
  },
  'process-accordion': {
    steps: [
      {
        id: 's1',
        stepNumber: 1,
        title: 'Diseño',
        summary: 'Plan del estudio.',
        details: ['Alcance', 'Métricas'],
      },
    ],
  },
  'process-branching': {
    initialStep: 'Recepción de solicitud',
    branchA: { title: 'Rama A', steps: ['Validar', 'Procesar'] },
    branchB: { title: 'Rama B', steps: ['Derivar', 'Revisar'] },
    mergeStep: 'Consolidación final',
  },
  'process-convergent': {
    sources: [{ title: 'Logs', detail: 'Telemetría del sistema.' }],
    outcomeTitle: 'Diagnóstico',
    outcomeDescription: 'Causa raíz identificada.',
  },
  'process-cycle': {
    phases: [{ phase: 'P1', name: 'Plan', description: 'Diseñar.' }],
  },
  'process-decision-tree': {
    question: '¿Latencia bajo SLO?',
    branchYes: { condition: 'Sí', action: 'Mantener despliegue.' },
    branchNo: { condition: 'No', action: 'Revertir cambio.' },
  },
  'process-funnel': {
    stages: [
      {
        stage: 'Leads',
        description: 'Contactos iniciales.',
        widthPercentage: '100%',
      },
    ],
  },
  'process-horizontal-3': {
    steps: [{ step: 1, title: 'Plan', description: 'Diseñar.' }],
  },
  'process-horizontal-4': {
    steps: [{ step: 1, title: 'Plan', description: 'Diseñar.' }],
  },
  'process-horizontal-5': {
    steps: [{ step: 1, title: 'Plan', description: 'Diseñar.' }],
  },
  'process-milestone-bar': {
    milestones: [
      { quarter: 'Q1', title: 'Línea base', description: 'Medición inicial.' },
    ],
  },
  'process-numbered-cards': {
    steps: [{ number: 1, title: 'Plan', description: 'Diseñar.' }],
  },
  'process-pipeline': {
    stages: [{ name: 'Build', status: 'passed' }],
  },
  'process-swimlane': {
    lanes: [{ laneName: 'Backend', actor: 'API', steps: ['Auth', 'Query'] }],
  },
  'process-vertical-steps': {
    steps: [{ number: 1, title: 'Plan', description: 'Diseñar.' }],
  },
  'process-zigzag': {
    steps: [{ step: 1, title: 'Plan', description: 'Diseñar.' }],
  },
  'quote-background-image': {
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    author: 'E. Dijkstra',
  },
  'quote-callout': {
    contextText: 'Sobre la arquitectura del sistema:',
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    author: 'E. Dijkstra',
  },
  'quote-centered-large': {
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    author: 'E. Dijkstra',
  },
  'quote-dialogue': {
    speakerA: {
      name: 'Tesis',
      role: 'Propuesta',
      quote: 'Centralizar el estado.',
    },
    speakerB: {
      name: 'Antítesis',
      role: 'Réplica',
      quote: 'Distribuir la carga.',
    },
  },
  'quote-multi-source': {
    quotes: [
      {
        quote: 'Medir antes de optimizar.',
        author: 'D. Knuth',
        source: 'TAOCP',
      },
    ],
  },
  'quote-sidebar-highlight': {
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    author: 'E. Dijkstra',
    contextText: 'Principio de diseño del sistema.',
  },
  'quote-split-author': {
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    author: 'E. Dijkstra',
    authorRole: 'Pionero de la computación',
  },
  'quote-testimonial-card': {
    quote: 'La plataforma elevó nuestra sustentación.',
    author: 'J. Pérez',
    role: 'Tesista EPIS',
  },
  'split-30-70': {
    sidebarTitle: 'Resumen',
    mainContent: 'Contenido principal de la diapositiva.',
  },
  'split-50-50-text': {},
  'split-70-30': {
    mainContent: 'Contenido principal de la diapositiva.',
    sidebarTitle: 'Datos clave',
  },
  'split-asymmetric-cards': {
    leftTitle: 'Antes',
    leftContent: 'Estado previo del sistema.',
    rightTitle: 'Después',
    rightContent: 'Estado optimizado.',
  },
  'split-before-after': {
    before: {
      title: 'Estado previo',
      items: ['Latencia 400ms', 'Uptime 95%'],
    },
    after: {
      title: 'Estado optimizado',
      items: ['Latencia 42ms', 'Uptime 99.9%'],
    },
  },
  'split-code-preview': {
    code: 'const deck = defineConfig({ theme: "unsa-dark" });',
    preview: 'Vista previa del componente.',
  },
  'split-comparison-cards': {
    left: { title: 'Opción A', features: ['Simple', 'Barato'] },
    right: { title: 'Opción B', features: ['Potente', 'Escalable'] },
  },
  'split-definition-example': {
    term: 'SLO',
    definition: 'Objetivo de nivel de servicio acordado.',
    exampleContent: '99.9% de disponibilidad mensual.',
  },
  'split-diagram-text': {
    diagram: 'Diagrama de arquitectura.',
    points: ['Capa API', 'Capa de datos'],
  },
  'split-image-text': {
    imageUrl: '/img.png',
    paragraphs: ['Párrafo introductorio del análisis.'],
  },
  'split-numbered-steps': {
    overviewTitle: 'Metodología',
    overviewText: 'Resumen del proceso aplicado.',
    steps: [{ title: 'Paso 1', description: 'Recolectar datos.' }],
  },
  'split-pros-cons': {
    pros: ['Escalable', 'Mantenible'],
    cons: ['Costo inicial'],
  },
  'split-quote-context': {
    contextTitle: 'Contexto',
    contextText: 'Situación analizada en el estudio.',
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    quoteAuthor: 'E. Dijkstra',
  },
  'split-stacked-left': {
    topCard: { title: 'Dato A', description: 'Primera evidencia.' },
    bottomCard: { title: 'Dato B', description: 'Segunda evidencia.' },
    rightTitle: 'Lectura',
    rightContent: 'Interpretación conjunta.',
  },
  'split-text-image': {
    paragraphs: ['Párrafo introductorio del análisis.'],
    imageUrl: '/img.png',
  },
  'stats-3-row': {
    stats: [
      { number: '42ms', label: 'Latencia' },
      { number: '99.9%', label: 'Uptime' },
    ],
  },
  'stats-4-grid': {
    stats: [
      { metric: '42ms', label: 'Latencia' },
      { metric: '99.9%', label: 'Uptime' },
    ],
  },
  'stats-before-after-metric': {
    metrics: [
      {
        metricName: 'Latencia',
        beforeVal: '400ms',
        afterVal: '42ms',
        improvement: '-90%',
      },
    ],
  },
  'stats-big-number-context': {
    metric: '3x',
    metricLabel: 'Mejora',
    contextTitle: 'Contexto',
    contextParagraphs: ['Medición en producción durante 30 días.'],
  },
  'stats-comparison-bar': {
    bars: [{ label: 'Región A', value: '80 req/s', percentage: 80 }],
  },
  'stats-donut-text': {
    mainPercentage: '72%',
    mainLabel: 'Cobertura',
    segments: [{ label: 'Core', percentage: '72%', detail: 'Crítico' }],
  },
  'stats-gauge-row': {
    gauges: [{ label: 'CPU', value: 62, statusNote: 'Estable' }],
  },
  'stats-icon-cards': {
    items: [
      { icon: '◆', metric: '42ms', label: 'Latencia', description: 'p95.' },
    ],
  },
  'stats-progress-cards': {
    items: [
      {
        goal: 'Migración',
        current: '70%',
        percentage: 70,
        status: 'en camino',
      },
    ],
  },
  'stats-ranked-list': {
    ranking: [{ rank: 1, entity: 'Nodo A', score: '98', metricLabel: 'Score' }],
  },
  'stats-single-hero': {
    metric: '99.9%',
    label: 'Disponibilidad',
  },
  'stats-sparkline-cards': {
    cards: [
      {
        metric: '42ms',
        label: 'Latencia',
        trend: 'a la baja',
        trendValue: '-12%',
        summary: 'Mejora sostenida.',
      },
    ],
  },
  'stats-summary-footer': {
    children: 'Resumen del trimestre.',
    metrics: [{ label: 'Uptime', value: '99.9%' }],
  },
  'stats-timeline-metric': {
    milestones: [{ period: 'Q1', metric: '95%', label: 'Cobertura' }],
  },
  'stats-with-change': {
    stats: [
      { metric: 'Latencia', label: 'p95', change: '-12%', isPositive: true },
    ],
  },
};

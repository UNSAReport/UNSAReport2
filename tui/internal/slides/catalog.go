package slides

import (
	"fmt"
	"sort"
	"strings"
)

type LayoutInfo struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// SupportedThemes declara los temas donde el layout luce óptimo
	// (matriz tema-layout). Vacío = universal. Espejo manual de
	// packages/slides-kit/src/layouts/catalog.ts (el kit manda).
	SupportedThemes []string `json:"supportedThemes,omitempty"`
}

type ThemeInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Default     bool   `json:"default"`
}

var officialThemes = []ThemeInfo{
	{
		ID:          "unsa-dark",
		Name:        "UNSA Dark",
		Description: "Estilo institucional oscuro con tonos granate y dorado UNSA. Ideal para informes de laboratorio, proyectos y defensas técnicas.",
		Default:     true,
	},
	{
		ID:          "unsa-classic",
		Name:        "UNSA Classic",
		Description: "Estilo formal claro con tipografía editorial y azul marino. Diseñado para sustentaciones formales de grado, defensas de tesis y eventos protocolares.",
		Default:     false,
	},
	{
		ID:          "epis-tech",
		Name:        "EPIS Tech",
		Description: "Estilo oscuro futurista con acentos cian y verde esmeralda. Recomendado para Ciencias de la Computación, arquitectura de software, demos y hackathons.",
		Default:     false,
	},
	{
		ID:          "fips-light",
		Name:        "FIPS Light",
		Description: "Tema claro institucional de la Facultad de Ingeniería de Producción y Servicios, fondo cálido con acentos azul FIPS. Ideal para sustentaciones diurnas y actos formales.",
		Default:     false,
	},
	{
		ID:          "epis-night",
		Name:        "EPIS Night",
		Description: "Tema nocturno azul profundo de EPIS con acentos cian y violeta. Ideal para demos en vivo, live coding y charlas técnicas nocturnas.",
		Default:     false,
	},
	{
		ID:          "cloudlet-pitch",
		Name:        "Cloudlet Pitch",
		Description: "Pitch claro de startup Cloudlet Tech con lavados grises y oscuros alternados y paneles degradados celestes. Ideal para presentaciones de emprendimiento, rondas de inversión y demos de producto.",
		Default:     false,
	},
	{
		ID:          "azul-proposal",
		Name:        "Azul Proposal",
		Description: "Propuesta de negocio sobre azul corporativo profundo con títulos apilados en dos líneas y doble franja de pie. Ideal para propuestas comerciales y presentaciones corporativas.",
		Default:     false,
	},
	{
		ID:          "harper-minimal",
		Name:        "Harper Minimal",
		Description: "Pitch minimalista en negro y rojo coral con numerales fantasma y reglas finas. Ideal para presentaciones de empresa y portfolios sobrios.",
		Default:     false,
	},
}

var officialCategories = []string{
	"hero",
	"split",
	"bento",
	"stats",
	"process",
	"code",
	"list",
	"quote",
	"closing",
	"template",
}

var officialLayouts = []LayoutInfo{
	// Hero (12)
	{"hero-centered-bold", "hero", "Hero Centered Bold", "Título central de alto impacto con subtítulo y autor", nil},
	{"hero-split-image", "hero", "Hero Split Image", "Título y contexto a la izquierda, imagen/gráfico destacado a la derecha", nil},
	{"hero-minimal", "hero", "Hero Minimal", "Tipografía limpia y minimalista para aperturas sobrias", nil},
	{"hero-kpi-banner", "hero", "Hero KPI Banner", "Título de portada acompañado de métrica o KPI clave inicial", nil},
	{"hero-institutional", "hero", "Hero Institutional", "Portada institucional formal con escudo, metadatos académicos y fecha", nil},
	{"hero-centered-subtitle", "hero", "Hero Centered Subtitle", "Título y subtítulo centrados con badge temático superior", nil},
	{"hero-full-image", "hero", "Hero Full Image", "Portada cinematográfica con imagen de fondo completa y texto superpuesto", nil},
	{"hero-gradient-accent", "hero", "Hero Gradient Accent", "Título con gradiente y acento cromático dinámico según tema", nil},
	{ID: "hero-two-line", Category: "hero", Name: "Hero Two Line", Description: "Título en dos líneas contrastadas para tesis y proyectos de grado", SupportedThemes: []string{"azul-proposal"}},
	{"hero-event-card", "hero", "Hero Event Card", "Portada tipo tarjeta de evento académico, simposio o conferencia", nil},
	{ID: "hero-cover-photo-blob", Category: "hero", Name: "Hero Cover Photo Blob", Description: "Portada estilo pitch con gran título, metadatos y panel decorativo rotado", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "hero-stacked-duo-footer", Category: "hero", Name: "Hero Stacked Duo Footer", Description: "Portada de propuesta con dos líneas apiladas en mayúsculas y barra de pie dual", SupportedThemes: []string{"azul-proposal"}},

	// Split (16)
	{"split-50-50-text", "split", "Split 50/50 Text", "Dos columnas equilibradas para contrastar ideas o conceptos", nil},
	{"split-comparison-cards", "split", "Split Comparison Cards", "Dos tarjetas comparativas para pros/contras o tecnologías", nil},
	{"split-code-preview", "split", "Split Code Preview", "Código fuente a la izquierda y resultado/explicación a la derecha", nil},
	{"split-image-text", "split", "Split Image Text", "Imagen a la izquierda y descripción detallada a la derecha", nil},
	{"split-text-image", "split", "Split Text Image", "Texto a la izquierda con ilustración o diagrama a la derecha", nil},
	{"split-30-70", "split", "Split 30/70", "Barra lateral estrecha de contexto y contenido principal expandido", nil},
	{"split-70-30", "split", "Split 70/30", "Contenido principal amplio a la izquierda con notas/KPIs a la derecha", nil},
	{"split-before-after", "split", "Split Before / After", "Comparativa visual antes y después con etiquetas distintivas", nil},
	{"split-pros-cons", "split", "Split Pros & Cons", "Dos columnas de evaluación con listas de ventajas y desventajas", nil},
	{"split-diagram-text", "split", "Split Diagram Text", "Diagrama técnico o arquitectura con desglose explicativo", nil},
	{"split-quote-context", "split", "Split Quote Context", "Cita destacada a la izquierda con análisis contextual a la derecha", nil},
	{ID: "split-numbered-steps", Category: "split", Name: "Split Numbered Steps", Description: "Pasos numerados secuenciales divididos en dos paneles", SupportedThemes: []string{"azul-proposal"}},
	{"split-definition-example", "split", "Split Definition Example", "Definición formal a la izquierda y ejemplo práctico a la derecha", nil},
	{"split-stacked-left", "split", "Split Stacked Left", "Dos tarjetas apiladas a la izquierda y bloque principal a la derecha", nil},
	{"split-asymmetric-cards", "split", "Split Asymmetric Cards", "Dos tarjetas con proporciones asimétricas para destacar prioridad", nil},
	{ID: "split-lead-plus-steps", Category: "split", Name: "Split Lead Plus Steps", Description: "Bloque introductorio superior con fila de pasos numerados debajo", SupportedThemes: []string{"azul-proposal"}},

	// Bento (20)
	{"bento-2x2-equal", "bento", "Bento 2x2 Equal", "Cuatro tarjetas iguales en matriz 2x2", nil},
	{"bento-4-featured-left", "bento", "Bento 4 Featured Left", "Tarjeta destacada a la izquierda y 3 secundarias a la derecha", nil},
	{"bento-4-featured-top", "bento", "Bento 4 Featured Top", "Tarjeta panorámica superior y 3 columnas inferiores", nil},
	{"bento-3-horizontal", "bento", "Bento 3 Horizontal", "Tres columnas horizontales con tarjeta central acentuada", nil},
	{"bento-3-vertical", "bento", "Bento 3 Vertical", "Tres filas apiladas verticalmente para flujos o secuencias", nil},
	{"bento-5-mosaic", "bento", "Bento 5 Mosaic", "Mosaico asimétrico de 5 celdas para dashboards", nil},
	{"bento-6-grid", "bento", "Bento 6 Grid", "Cuadrícula balanceada de 6 bloques para taxonomías", nil},
	{"bento-hero-sidebar", "bento", "Bento Hero Sidebar", "Bloque dominante tipo hero con barra lateral de 2 tarjetas", nil},
	{"bento-l-shape", "bento", "Bento L-Shape", "Disposición en forma de L para destacar flujo de datos", nil},
	{"bento-t-shape", "bento", "Bento T-Shape", "Disposición en forma de T con cabecera y panel central", nil},
	{"bento-dashboard", "bento", "Bento Dashboard", "Estilo panel de control con métricas y estado del sistema", nil},
	{"bento-2-wide-1-tall", "bento", "Bento 2-Wide 1-Tall", "Dos bloques anchos y uno vertical para comparaciones", nil},
	{"bento-1-wide-2-stacked", "bento", "Bento 1-Wide 2-Stacked", "Un bloque ancho superior y dos apilados debajo", nil},
	{"bento-pyramid", "bento", "Bento Pyramid", "Estructura piramidal con bloque superior y base múltiple", nil},
	{"bento-cross", "bento", "Bento Cross", "Distribución en cruz con celda central y satélites", nil},
	{"bento-diagonal", "bento", "Bento Diagonal", "Flujo diagonal para guiar la lectura de hitos", nil},
	{"bento-sidebar-main", "bento", "Bento Sidebar Main", "Panel lateral de navegación/resumen con área central principal", nil},
	{"bento-header-grid", "bento", "Bento Header Grid", "Encabezado descriptivo con cuadrícula de 4 tarjetas", nil},
	{"bento-footer-grid", "bento", "Bento Footer Grid", "Cuadrícula de 4 elementos con pie de resumen o conclusión", nil},
	{"bento-magazine", "bento", "Bento Magazine", "Composición tipo revista para presentaciones editoriales y de divulgación", nil},

	// Stats (16)
	{"stats-single-hero", "stats", "Stats Single Hero", "Un número gigante para métrica reina", nil},
	{"stats-3-row", "stats", "Stats 3 Row", "Tres KPIs clave horizontales con etiquetas y contexto", nil},
	{"stats-4-grid", "stats", "Stats 4 Grid", "Matriz 2x2 de métricas con indicadores de tendencia", nil},
	{"stats-with-change", "stats", "Stats With Change", "Métricas con porcentaje de cambio respecto al periodo anterior", nil},
	{"stats-comparison-bar", "stats", "Stats Comparison Bar", "Barras de comparación métrica entre dos o tres soluciones", nil},
	{"stats-donut-text", "stats", "Stats Donut Text", "Gráfico circular o donut con texto descriptivo adyacente", nil},
	{"stats-progress-cards", "stats", "Stats Progress Cards", "Tarjetas con barras de progreso hacia objetivos", nil},
	{"stats-timeline-metric", "stats", "Stats Timeline Metric", "Hitos temporales asociados a métricas de crecimiento", nil},
	{"stats-ranked-list", "stats", "Stats Ranked List", "Lista clasificada con posiciones numéricas y valores", nil},
	{"stats-gauge-row", "stats", "Stats Gauge Row", "Indicadores tipo velocímetro o gauge para rendimiento", nil},
	{"stats-big-number-context", "stats", "Stats Big Number Context", "Número monumental con párrafo de análisis y conclusiones", nil},
	{"stats-icon-cards", "stats", "Stats Icon Cards", "Tarjetas de estadísticas con iconos semánticos destacados", nil},
	{"stats-before-after-metric", "stats", "Stats Before/After Metric", "Comparación de métricas antes y después de una intervención", nil},
	{"stats-sparkline-cards", "stats", "Stats Sparkline Cards", "Tarjetas de KPIs con visualización de tendencia histórica", nil},
	{"stats-summary-footer", "stats", "Stats Summary Footer", "Tres estadísticas compactas con pie de página analítico", nil},
	{ID: "stats-team-grid", Category: "stats", Name: "Stats Team Grid", Description: "Grilla de equipo 4-up con marco de foto y nombre en mayúsculas", SupportedThemes: []string{"cloudlet-pitch"}},

	// Process (16)
	{"process-horizontal-3", "process", "Process Horizontal 3", "Flujo secuencial de 3 fases con conectores", nil},
	{"process-horizontal-4", "process", "Process Horizontal 4", "Flujo secuencial de 4 fases con conectores", nil},
	{"process-horizontal-5", "process", "Process Horizontal 5", "Flujo secuencial de 5 fases para metodologías completas", nil},
	{"process-vertical-steps", "process", "Process Vertical Steps", "Pasos verticales con numeración destacada para algoritmos", nil},
	{"process-numbered-cards", "process", "Process Numbered Cards", "Tarjetas numeradas en cuadrícula indicando secuencia", nil},
	{"process-cycle", "process", "Process Cycle", "Ciclo continuo circular para metodologías ágiles o DevOps", nil},
	{"process-funnel", "process", "Process Funnel", "Embudo de conversión o filtrado de etapas", nil},
	{"process-zigzag", "process", "Process Zigzag", "Flujo en zigzag para procesos largos de más de 4 etapas", nil},
	{"process-branching", "process", "Process Branching", "Proceso con bifurcación condicional", nil},
	{"process-pipeline", "process", "Process Pipeline", "Tubería de integración/despliegue continuo (CI/CD)", nil},
	{"process-milestone-bar", "process", "Process Milestone Bar", "Línea de hitos clave con fechas y entregables", nil},
	{"process-accordion", "process", "Process Accordion", "Fases apiladas tipo acordeón con detalle expandido", nil},
	{"process-convergent", "process", "Process Convergent", "Múltiples fuentes convergiendo en un resultado final", nil},
	{"process-swimlane", "process", "Process Swimlane", "Carriles de responsabilidades para flujos multi-rol", nil},
	{"process-decision-tree", "process", "Process Decision Tree", "Árbol de decisiones binarias paso a paso", nil},
	{"process-quarter-roadmap", "process", "Process Quarter Roadmap", "Roadmap trimestral con chips Q sobre 4 tarjetas de hitos", nil},

	// Code (10)
	{"code-fullscreen", "code", "Code Fullscreen", "Bloque de código a pantalla completa con sintaxis resaltada", nil},
	{"code-with-output", "code", "Code With Output", "Código arriba y salida de consola o terminal abajo", nil},
	{"code-split-terminal", "code", "Code Split Terminal", "Código fuente a la izquierda y terminal interactiva a la derecha", nil},
	{"code-annotated", "code", "Code Annotated", "Código con llamadas numéricas explicativas al costado", nil},
	{"code-tabs", "code", "Code Tabs", "Pestañas para comparar el mismo algoritmo en múltiples lenguajes", nil},
	{"code-diff", "code", "Code Diff", "Vista de diferencias estilo Git diff destacando líneas agregadas/eliminadas", nil},
	{"code-architecture-stack", "code", "Code Architecture Stack", "Pila de código mostrando capas de arquitectura", nil},
	{"code-snippet-gallery", "code", "Code Snippet Gallery", "Galería de fragmentos cortos de código en cuadrícula", nil},
	{"code-step-by-step", "code", "Code Step By Step", "Explicación incremental de una función o bloque de código", nil},
	{"code-api-endpoint", "code", "Code API Endpoint", "Definición de endpoint REST/GraphQL con request y response", nil},
	// List (13)

	{"list-bullet-cards", "list", "List Bullet Cards", "Tarjetas individuales con viñetas estilizadas", nil},
	{"list-icon-items", "list", "List Icon Items", "Lista vertical con iconos semánticos en cada elemento", nil},
	{"list-numbered-vertical", "list", "List Numbered Vertical", "Lista numerada grande con títulos y descripciones", nil},
	{"list-checklist", "list", "List Checklist", "Lista de verificación con casillas de estado", nil},
	{"list-hierarchy-tree", "list", "List Hierarchy Tree", "Estructura jerárquica en árbol para taxonomías", nil},
	{"list-pyramid", "list", "List Pyramid", "Lista organizada en niveles piramidales de abstracción", nil},
	{"list-agenda-badges", "list", "List Agenda Badges", "Agenda o temario con badges de tiempo y estado", nil},
	{"list-definition-terms", "list", "List Definition Terms", "Glosario de términos técnicos con definiciones claras", nil},
	{"list-pros-cons-columns", "list", "List Pros & Cons Columns", "Columnas de ventajas y consideraciones clave", nil},
	{"list-timeline-vertical", "list", "List Timeline Vertical", "Línea de tiempo vertical con eventos y fechas", nil},
	{"list-toc-numbered", "list", "List TOC Numbered", "Índice numerado con líderes punteados y números de página", nil},
	{"list-numbered-grid-4", "list", "List Numbered Grid 4", "Cuadrícula 2x2 de cuatro elementos con numerales grandes como ancla visual", nil},
	{ID: "list-pill-stack", Category: "list", Name: "List Pill Stack", Description: "Pila vertical de píldoras uppercase de ancho completo", SupportedThemes: []string{"harper-minimal"}},

	// Quote (9)
	{"quote-centered-large", "quote", "Quote Centered Large", "Cita monumental centrada para frases inspiradoras", nil},
	{"quote-split-author", "quote", "Quote Split Author", "Cita a la izquierda y foto/biografía del autor a la derecha", nil},
	{"quote-callout", "quote", "Quote Callout", "Cuadro destacado de advertencia, nota o regla fundamental", nil},
	{"quote-background-image", "quote", "Quote Background Image", "Cita sobre imagen de fondo atenuada", nil},
	{"quote-testimonial-card", "quote", "Quote Testimonial Card", "Tarjeta estilo testimonio con avatar y credenciales", nil},
	{"quote-multi-source", "quote", "Quote Multi Source", "Comparación de dos o tres citas sobre el mismo tema", nil},
	{"quote-sidebar-highlight", "quote", "Quote Sidebar Highlight", "Cita condensada en barra lateral junto al texto principal", nil},
	{"quote-dialogue", "quote", "Quote Dialogue", "Conversación o debate entre dos autores o perspectivas", nil},
	{ID: "quote-ghost-numeral", Category: "quote", Name: "Quote Ghost Numeral", Description: "Cita con numeral fantasma oversized de fondo y barra de acento", SupportedThemes: []string{"harper-minimal"}},

	// Closing (8)
	{"closing-qa-centered", "closing", "Closing Q&A Centered", "Diapositiva de preguntas y respuestas con tipografía destacada", nil},
	{"closing-summary-3-points", "closing", "Closing Summary 3 Points", "Resumen de los 3 aprendizajes o conclusiones fundamentales", nil},
	{"closing-contact-card", "closing", "Closing Contact Card", "Tarjeta de contacto con redes, email institucional y QR", nil},
	{"closing-credits-scroll", "closing", "Closing Credits Scroll", "Créditos formales, referencias bibliográficas y agradecimientos", nil},
	{"closing-cta-centered", "closing", "Closing CTA Centered", "Llamado a la acción central para demos o siguientes pasos", nil},
	{"closing-next-steps", "closing", "Closing Next Steps", "Hoja de ruta inmediata con próximos pasos del proyecto", nil},
	{"closing-thank-you", "closing", "Closing Thank You", "Agradecimiento institucional formal de clausura", nil},
	{"closing-cover-mirror", "closing", "Closing Cover Mirror", "Cierre que refleja la portada con doble línea gigante y pie dual", nil},

	// Template (37: 11 azul + 14 cloudlet + 12 harper)
	{ID: "azul-proposal/cover-duo", Category: "template", Name: "Azul Cover Duo", Description: "Portada de propuesta con doble línea apilada, foto y franja de pie dual", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/market-opportunity", Category: "template", Name: "Azul Market Opportunity", Description: "Oportunidad de mercado con numerales 01/02 y foto lateral", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/problem-statement", Category: "template", Name: "Azul Problem Statement", Description: "Planteamiento del problema con tarjetas numeradas 01-03", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/our-solution", Category: "template", Name: "Azul Our Solution", Description: "Nuestra solución con línea de tiempo vertical 01-03", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/value-proposition", Category: "template", Name: "Azul Value Proposition", Description: "Propuesta de valor con 4 hitos sobre línea horizontal", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/target-audience", Category: "template", Name: "Azul Target Audience", Description: "Audiencia objetivo con 4 tarjetas de segmentos", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/competitive-analysis", Category: "template", Name: "Azul Competitive Analysis", Description: "Análisis competitivo con foto y panel de texto", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/marketing-strategy", Category: "template", Name: "Azul Marketing Strategy", Description: "Estrategia de marketing y ventas con foto lateral", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/implementation-plan", Category: "template", Name: "Azul Implementation Plan", Description: "Plan de implementación centrado", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/conclusion-next-steps", Category: "template", Name: "Azul Conclusion Next Steps", Description: "Conclusión y próximos pasos", SupportedThemes: []string{"azul-proposal"}},
	{ID: "azul-proposal/thank-you", Category: "template", Name: "Azul Thank You", Description: "Cierre de agradecimiento espejo de portada", SupportedThemes: []string{"azul-proposal"}},
	{ID: "cloudlet-pitch/cover", Category: "template", Name: "Cloudlet Cover", Description: "Portada pitch startup con panel degradado y foto", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/agenda", Category: "template", Name: "Cloudlet Agenda", Description: "Agenda del día con puntos numerados", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/introduction", Category: "template", Name: "Cloudlet Introduction", Description: "Introducción de la empresa con foto", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/problem-statement", Category: "template", Name: "Cloudlet Problem Statement", Description: "Tres problemas en tarjetas", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/innovative-solutions", Category: "template", Name: "Cloudlet Innovative Solutions", Description: "Tres soluciones innovadoras en tarjetas", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/services", Category: "template", Name: "Cloudlet Services", Description: "Cuatro servicios con iconos", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/market-size", Category: "template", Name: "Cloudlet Market Size", Description: "Tamaño de mercado con métricas destacadas", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/competitors", Category: "template", Name: "Cloudlet Competitors", Description: "Competidores directos e indirectos", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/advantages", Category: "template", Name: "Cloudlet Advantages", Description: "Ventajas competitivas clave", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/traction", Category: "template", Name: "Cloudlet Traction", Description: "Tracción con métricas de crecimiento", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/accomplishments", Category: "template", Name: "Cloudlet Accomplishments", Description: "Logros por año en línea temporal", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/use-of-funds", Category: "template", Name: "Cloudlet Use Of Funds", Description: "Uso de fondos con desglose", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/team", Category: "template", Name: "Cloudlet Team", Description: "Equipo con fotos y roles", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "cloudlet-pitch/thank-you", Category: "template", Name: "Cloudlet Thank You", Description: "Cierre de agradecimiento", SupportedThemes: []string{"cloudlet-pitch"}},
	{ID: "harper-minimal/cover", Category: "template", Name: "Harper Cover", Description: "Portada minimalista con textura de grano coral", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/contents", Category: "template", Name: "Harper Contents", Description: "Tabla de contenidos con numerales fantasma", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/stats", Category: "template", Name: "Harper Stats", Description: "Tres estadísticas con numerales grandes", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/problem", Category: "template", Name: "Harper Problem", Description: "El problema con texto editorial", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/solution", Category: "template", Name: "Harper Solution", Description: "Nuestra solución con descripción de plataforma", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/market-opportunity", Category: "template", Name: "Harper Market Opportunity", Description: "Oportunidad de mercado con visual", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/why-now", Category: "template", Name: "Harper Why Now", Description: "Por qué ahora con razones temporales", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/product-overview", Category: "template", Name: "Harper Product Overview", Description: "Resumen de producto con visual", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/features", Category: "template", Name: "Harper Features", Description: "Características clave en tarjetas", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/business-model", Category: "template", Name: "Harper Business Model", Description: "Modelo de negocio", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/roadmap-quarters", Category: "template", Name: "Harper Roadmap Quarters", Description: "Hoja de ruta por trimestres", SupportedThemes: []string{"harper-minimal"}},
	{ID: "harper-minimal/closing", Category: "template", Name: "Harper Closing", Description: "Cierre minimalista espejo de portada", SupportedThemes: []string{"harper-minimal"}},
}

func ListCategories() []string {
	return officialCategories
}

// SupportsTheme indica si un layout luce óptimo en un tema.
// Sin declaración (SupportedThemes vacío) = universal.
func SupportsTheme(l LayoutInfo, themeID string) bool {
	themeID = strings.ToLower(strings.TrimSpace(themeID))
	if len(l.SupportedThemes) == 0 {
		return true
	}
	for _, t := range l.SupportedThemes {
		if strings.ToLower(strings.TrimSpace(t)) == themeID {
			return true
		}
	}
	return false
}

// ListLayoutsByTheme filtra el espejo por compatibilidad de tema:
// universales más los que declaran el tema.
func ListLayoutsByTheme(themeID string) []LayoutInfo {
	var results []LayoutInfo
	for _, l := range officialLayouts {
		if SupportsTheme(l, themeID) {
			results = append(results, l)
		}
	}
	return results
}

// ListThemesByLayout devuelve los temas compatibles con un layout desde el
// espejo. El lado tema no restringe (ningún ThemeInfo declara supportedLayouts),
// así que un layout universal es compatible con los 8 temas y uno firma solo
// con los suyos.
func ListThemesByLayout(layoutID string) []ThemeInfo {
	for _, l := range officialLayouts {
		if l.ID == layoutID {
			if len(l.SupportedThemes) == 0 {
				return officialThemes
			}
			var results []ThemeInfo
			for _, t := range officialThemes {
				if SupportsTheme(l, t.ID) {
					results = append(results, t)
				}
			}
			return results
		}
	}
	return nil
}

// OfficialMatrixPairs devuelve los pares "layout@theme" declarados en el
// espejo (solo firmas; los universales no generan pares).
func OfficialMatrixPairs() []string {
	var pairs []string
	for _, l := range officialLayouts {
		for _, t := range l.SupportedThemes {
			pairs = append(pairs, l.ID+"@"+t)
		}
	}
	sort.Strings(pairs)
	return pairs
}

// MatrixDriftReport compara pares "layout@theme" del kit contra el espejo y
// reporta diferencias, o "" cuando la matriz coincide.
func MatrixDriftReport(kitPairs []string) string {
	official := make(map[string]bool, 8)
	for _, p := range OfficialMatrixPairs() {
		official[p] = true
	}
	inKit := make(map[string]bool, len(kitPairs))
	for _, p := range kitPairs {
		inKit[p] = true
	}
	var missing, extra []string
	for p := range official {
		if !inKit[p] {
			missing = append(missing, p)
		}
	}
	for p := range inKit {
		if !official[p] {
			extra = append(extra, p)
		}
	}
	sort.Strings(missing)
	sort.Strings(extra)
	var lines []string
	if len(missing) > 0 {
		lines = append(lines, fmt.Sprintf("matrix pairs missing from kit (%d): %s", len(missing), strings.Join(missing, ", ")))
	}
	if len(extra) > 0 {
		lines = append(lines, fmt.Sprintf("matrix pairs in kit but not in catalog (%d): %s", len(extra), strings.Join(extra, ", ")))
	}
	return strings.Join(lines, "\n")
}

func ListThemes() []ThemeInfo {
	return officialThemes
}

// ThemeRegistered indica si un id de tema existe en el catálogo oficial
// (incluye los 3 temas portados: azul-proposal, cloudlet-pitch,
// harper-minimal). Úsalo para validar flags como `init --theme`.
func ThemeRegistered(id string) bool {
	id = strings.ToLower(strings.TrimSpace(id))
	for _, t := range officialThemes {
		if strings.ToLower(t.ID) == id {
			return true
		}
	}
	return false
}

// ThemeIDs devuelve los ids oficiales en orden de catálogo (para mensajes).
func ThemeIDs() []string {
	ids := make([]string, 0, len(officialThemes))
	for _, t := range officialThemes {
		ids = append(ids, t.ID)
	}
	return ids
}

func ListLayouts(category, search string) []LayoutInfo {
	catFilter := strings.ToLower(strings.TrimSpace(category))
	searchFilter := strings.ToLower(strings.TrimSpace(search))

	var results []LayoutInfo
	for _, l := range officialLayouts {
		if catFilter != "" && l.Category != catFilter {
			continue
		}
		if searchFilter != "" {
			inID := strings.Contains(strings.ToLower(l.ID), searchFilter)
			inName := strings.Contains(strings.ToLower(l.Name), searchFilter)
			inDesc := strings.Contains(strings.ToLower(l.Description), searchFilter)
			if !inID && !inName && !inDesc {
				continue
			}
		}
		results = append(results, l)
	}
	return results
}

// Manual sync checklist — run after any slides-kit layout/theme addition
// (packages/slides-kit/src): mirror the change here by adding/removing the
// entry in officialLayouts or officialThemes (plus officialCategories for a
// new category), update the TestCatalog counts and
// TestCatalog_ThemeAgreementWithKit in tui/internal/slides/slides_test.go,
// and refresh any docs pinning the inventory size (e.g. "110 layouts").
//
// DriftReport diffs these hardcoded official lists against a kit inventory
// (layout/theme IDs) and reports every mismatch, or "" when both agree.
func DriftReport(kitLayouts []string, kitThemes []string) string {
	officialLayoutIDs := make(map[string]bool, len(officialLayouts))
	for _, l := range officialLayouts {
		officialLayoutIDs[l.ID] = true
	}
	officialThemeIDs := make(map[string]bool, len(officialThemes))
	for _, t := range officialThemes {
		officialThemeIDs[t.ID] = true
	}
	var lines []string
	diff := func(kind string, official map[string]bool, kit []string) {
		inKit := make(map[string]bool, len(kit))
		for _, id := range kit {
			inKit[id] = true
		}
		var missing, extra []string
		for id := range official {
			if !inKit[id] {
				missing = append(missing, id)
			}
		}
		for id := range inKit {
			if !official[id] {
				extra = append(extra, id)
			}
		}
		sort.Strings(missing)
		sort.Strings(extra)
		if len(missing) > 0 {
			lines = append(lines, fmt.Sprintf("%s missing from kit (%d): %s", kind, len(missing), strings.Join(missing, ", ")))
		}
		if len(extra) > 0 {
			lines = append(lines, fmt.Sprintf("%s in kit but not in catalog (%d): %s", kind, len(extra), strings.Join(extra, ", ")))
		}
	}
	diff("layouts", officialLayoutIDs, kitLayouts)
	diff("themes", officialThemeIDs, kitThemes)
	return strings.Join(lines, "\n")
}

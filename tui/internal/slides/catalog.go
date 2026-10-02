package slides

import (
	"strings"
)

type LayoutInfo struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
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
}

var officialLayouts = []LayoutInfo{
	// Hero (10)
	{"hero-centered-bold", "hero", "Hero Centered Bold", "Título central de alto impacto con subtítulo y autor"},
	{"hero-split-image", "hero", "Hero Split Image", "Título y contexto a la izquierda, imagen/gráfico destacado a la derecha"},
	{"hero-minimal", "hero", "Hero Minimal", "Tipografía limpia y minimalista para aperturas sobrias"},
	{"hero-kpi-banner", "hero", "Hero KPI Banner", "Título de portada acompañado de métrica o KPI clave inicial"},
	{"hero-institutional", "hero", "Hero Institutional", "Portada institucional formal con escudo, metadatos académicos y fecha"},
	{"hero-centered-subtitle", "hero", "Hero Centered Subtitle", "Título y subtítulo centrados con badge temático superior"},
	{"hero-full-image", "hero", "Hero Full Image", "Portada cinematográfica con imagen de fondo completa y texto superpuesto"},
	{"hero-gradient-accent", "hero", "Hero Gradient Accent", "Título con gradiente y acento cromático dinámico según tema"},
	{"hero-two-line", "hero", "Hero Two Line", "Título en dos líneas contrastadas para tesis y proyectos de grado"},
	{"hero-event-card", "hero", "Hero Event Card", "Portada tipo tarjeta de evento académico, simposio o conferencia"},

	// Split (15)
	{"split-50-50-text", "split", "Split 50/50 Text", "Dos columnas equilibradas para contrastar ideas o conceptos"},
	{"split-comparison-cards", "split", "Split Comparison Cards", "Dos tarjetas comparativas para pros/contras o tecnologías"},
	{"split-code-preview", "split", "Split Code Preview", "Código fuente a la izquierda y resultado/explicación a la derecha"},
	{"split-image-text", "split", "Split Image Text", "Imagen a la izquierda y descripción detallada a la derecha"},
	{"split-text-image", "split", "Split Text Image", "Texto a la izquierda con ilustración o diagrama a la derecha"},
	{"split-30-70", "split", "Split 30/70", "Barra lateral estrecha de contexto y contenido principal expandido"},
	{"split-70-30", "split", "Split 70/30", "Contenido principal amplio a la izquierda con notas/KPIs a la derecha"},
	{"split-before-after", "split", "Split Before / After", "Comparativa visual antes y después con etiquetas distintivas"},
	{"split-pros-cons", "split", "Split Pros & Cons", "Dos columnas de evaluación con listas de ventajas y desventajas"},
	{"split-diagram-text", "split", "Split Diagram Text", "Diagrama técnico o arquitectura con desglose explicativo"},
	{"split-quote-context", "split", "Split Quote Context", "Cita destacada a la izquierda con análisis contextual a la derecha"},
	{"split-numbered-steps", "split", "Split Numbered Steps", "Pasos numerados secuenciales divididos en dos paneles"},
	{"split-definition-example", "split", "Split Definition Example", "Definición formal a la izquierda y ejemplo práctico a la derecha"},
	{"split-stacked-left", "split", "Split Stacked Left", "Dos tarjetas apiladas a la izquierda y bloque principal a la derecha"},
	{"split-asymmetric-cards", "split", "Split Asymmetric Cards", "Dos tarjetas con proporciones asimétricas para destacar prioridad"},

	// Bento (20)
	{"bento-2x2-equal", "bento", "Bento 2x2 Equal", "Cuatro tarjetas iguales en matriz 2x2"},
	{"bento-4-featured-left", "bento", "Bento 4 Featured Left", "Tarjeta destacada a la izquierda y 3 secundarias a la derecha"},
	{"bento-4-featured-top", "bento", "Bento 4 Featured Top", "Tarjeta panorámica superior y 3 columnas inferiores"},
	{"bento-3-horizontal", "bento", "Bento 3 Horizontal", "Tres columnas horizontales con tarjeta central acentuada"},
	{"bento-3-vertical", "bento", "Bento 3 Vertical", "Tres filas apiladas verticalmente para flujos o secuencias"},
	{"bento-5-mosaic", "bento", "Bento 5 Mosaic", "Mosaico asimétrico de 5 celdas para dashboards"},
	{"bento-6-grid", "bento", "Bento 6 Grid", "Cuadrícula balanceada de 6 bloques para taxonomías"},
	{"bento-hero-sidebar", "bento", "Bento Hero Sidebar", "Bloque dominante tipo hero con barra lateral de 2 tarjetas"},
	{"bento-l-shape", "bento", "Bento L-Shape", "Disposición en forma de L para destacar flujo de datos"},
	{"bento-t-shape", "bento", "Bento T-Shape", "Disposición en forma de T con cabecera y panel central"},
	{"bento-dashboard", "bento", "Bento Dashboard", "Estilo panel de control con métricas y estado del sistema"},
	{"bento-2-wide-1-tall", "bento", "Bento 2-Wide 1-Tall", "Dos bloques anchos y uno vertical para comparaciones"},
	{"bento-1-wide-2-stacked", "bento", "Bento 1-Wide 2-Stacked", "Un bloque ancho superior y dos apilados debajo"},
	{"bento-pyramid", "bento", "Bento Pyramid", "Estructura piramidal con bloque superior y base múltiple"},
	{"bento-cross", "bento", "Bento Cross", "Distribución en cruz con celda central y satélites"},
	{"bento-diagonal", "bento", "Bento Diagonal", "Flujo diagonal para guiar la lectura de hitos"},
	{"bento-sidebar-main", "bento", "Bento Sidebar Main", "Panel lateral de navegación/resumen con área central principal"},
	{"bento-header-grid", "bento", "Bento Header Grid", "Encabezado descriptivo con cuadrícula de 4 tarjetas"},
	{"bento-footer-grid", "bento", "Bento Footer Grid", "Cuadrícula de 4 elementos con pie de resumen o conclusión"},
	{"bento-magazine", "bento", "Bento Magazine", "Composición tipo revista para presentaciones editoriales y de divulgación"},

	// Stats (15)
	{"stats-single-hero", "stats", "Stats Single Hero", "Un número gigante para métrica reina"},
	{"stats-3-row", "stats", "Stats 3 Row", "Tres KPIs clave horizontales con etiquetas y contexto"},
	{"stats-4-grid", "stats", "Stats 4 Grid", "Matriz 2x2 de métricas con indicadores de tendencia"},
	{"stats-with-change", "stats", "Stats With Change", "Métricas con porcentaje de cambio respecto al periodo anterior"},
	{"stats-comparison-bar", "stats", "Stats Comparison Bar", "Barras de comparación métrica entre dos o tres soluciones"},
	{"stats-donut-text", "stats", "Stats Donut Text", "Gráfico circular o donut con texto descriptivo adyacente"},
	{"stats-progress-cards", "stats", "Stats Progress Cards", "Tarjetas con barras de progreso hacia objetivos"},
	{"stats-timeline-metric", "stats", "Stats Timeline Metric", "Hitos temporales asociados a métricas de crecimiento"},
	{"stats-ranked-list", "stats", "Stats Ranked List", "Lista clasificada con posiciones numéricas y valores"},
	{"stats-gauge-row", "stats", "Stats Gauge Row", "Indicadores tipo velocímetro o gauge para rendimiento"},
	{"stats-big-number-context", "stats", "Stats Big Number Context", "Número monumental con párrafo de análisis y conclusiones"},
	{"stats-icon-cards", "stats", "Stats Icon Cards", "Tarjetas de estadísticas con iconos semánticos destacados"},
	{"stats-before-after-metric", "stats", "Stats Before/After Metric", "Comparación de métricas antes y después de una intervención"},
	{"stats-sparkline-cards", "stats", "Stats Sparkline Cards", "Tarjetas de KPIs con visualización de tendencia histórica"},
	{"stats-summary-footer", "stats", "Stats Summary Footer", "Tres estadísticas compactas con pie de página analítico"},

	// Process (15)
	{"process-horizontal-3", "process", "Process Horizontal 3", "Flujo secuencial de 3 fases con conectores"},
	{"process-horizontal-4", "process", "Process Horizontal 4", "Flujo secuencial de 4 fases con conectores"},
	{"process-horizontal-5", "process", "Process Horizontal 5", "Flujo secuencial de 5 fases para metodologías completas"},
	{"process-vertical-steps", "process", "Process Vertical Steps", "Pasos verticales con numeración destacada para algoritmos"},
	{"process-numbered-cards", "process", "Process Numbered Cards", "Tarjetas numeradas en cuadrícula indicando secuencia"},
	{"process-cycle", "process", "Process Cycle", "Ciclo continuo circular para metodologías ágiles o DevOps"},
	{"process-funnel", "process", "Process Funnel", "Embudo de conversión o filtrado de etapas"},
	{"process-zigzag", "process", "Process Zigzag", "Flujo en zigzag para procesos largos de más de 4 etapas"},
	{"process-branching", "process", "Process Branching", "Proceso con bifurcación condicional"},
	{"process-pipeline", "process", "Process Pipeline", "Tubería de integración/despliegue continuo (CI/CD)"},
	{"process-milestone-bar", "process", "Process Milestone Bar", "Línea de hitos clave con fechas y entregables"},
	{"process-accordion", "process", "Process Accordion", "Fases apiladas tipo acordeón con detalle expandido"},
	{"process-convergent", "process", "Process Convergent", "Múltiples fuentes convergiendo en un resultado final"},
	{"process-swimlane", "process", "Process Swimlane", "Carriles de responsabilidades para flujos multi-rol"},
	{"process-decision-tree", "process", "Process Decision Tree", "Árbol de decisiones binarias paso a paso"},

	// Code (10)
	{"code-fullscreen", "code", "Code Fullscreen", "Bloque de código a pantalla completa con sintaxis resaltada"},
	{"code-with-output", "code", "Code With Output", "Código arriba y salida de consola o terminal abajo"},
	{"code-split-terminal", "code", "Code Split Terminal", "Código fuente a la izquierda y terminal interactiva a la derecha"},
	{"code-annotated", "code", "Code Annotated", "Código con llamadas numéricas explicativas al costado"},
	{"code-tabs", "code", "Code Tabs", "Pestañas para comparar el mismo algoritmo en múltiples lenguajes"},
	{"code-diff", "code", "Code Diff", "Vista de diferencias estilo Git diff destacando líneas agregadas/eliminadas"},
	{"code-architecture-stack", "code", "Code Architecture Stack", "Pila de código mostrando capas de arquitectura"},
	{"code-snippet-gallery", "code", "Code Snippet Gallery", "Galería de fragmentos cortos de código en cuadrícula"},
	{"code-step-by-step", "code", "Code Step By Step", "Explicación incremental de una función o bloque de código"},
	{"code-api-endpoint", "code", "Code API Endpoint", "Definición de endpoint REST/GraphQL con request y response"},

	// List (10)
	{"list-bullet-cards", "list", "List Bullet Cards", "Tarjetas individuales con viñetas estilizadas"},
	{"list-icon-items", "list", "List Icon Items", "Lista vertical con iconos semánticos en cada elemento"},
	{"list-numbered-vertical", "list", "List Numbered Vertical", "Lista numerada grande con títulos y descripciones"},
	{"list-checklist", "list", "List Checklist", "Lista de verificación con casillas de estado"},
	{"list-hierarchy-tree", "list", "List Hierarchy Tree", "Estructura jerárquica en árbol para taxonomías"},
	{"list-pyramid", "list", "List Pyramid", "Lista organizada en niveles piramidales de abstracción"},
	{"list-agenda-badges", "list", "List Agenda Badges", "Agenda o temario con badges de tiempo y estado"},
	{"list-definition-terms", "list", "List Definition Terms", "Glosario de términos técnicos con definiciones claras"},
	{"list-pros-cons-columns", "list", "List Pros & Cons Columns", "Columnas de ventajas y consideraciones clave"},
	{"list-timeline-vertical", "list", "List Timeline Vertical", "Línea de tiempo vertical con eventos y fechas"},

	// Quote (8)
	{"quote-centered-large", "quote", "Quote Centered Large", "Cita monumental centrada para frases inspiradoras"},
	{"quote-split-author", "quote", "Quote Split Author", "Cita a la izquierda y foto/biografía del autor a la derecha"},
	{"quote-callout", "quote", "Quote Callout", "Cuadro destacado de advertencia, nota o regla fundamental"},
	{"quote-background-image", "quote", "Quote Background Image", "Cita sobre imagen de fondo atenuada"},
	{"quote-testimonial-card", "quote", "Quote Testimonial Card", "Tarjeta estilo testimonio con avatar y credenciales"},
	{"quote-multi-source", "quote", "Quote Multi Source", "Comparación de dos o tres citas sobre el mismo tema"},
	{"quote-sidebar-highlight", "quote", "Quote Sidebar Highlight", "Cita condensada en barra lateral junto al texto principal"},
	{"quote-dialogue", "quote", "Quote Dialogue", "Conversación o debate entre dos autores o perspectivas"},

	// Closing (7)
	{"closing-qa-centered", "closing", "Closing Q&A Centered", "Diapositiva de preguntas y respuestas con tipografía destacada"},
	{"closing-summary-3-points", "closing", "Closing Summary 3 Points", "Resumen de los 3 aprendizajes o conclusiones fundamentales"},
	{"closing-contact-card", "closing", "Closing Contact Card", "Tarjeta de contacto con redes, email institucional y QR"},
	{"closing-credits-scroll", "closing", "Closing Credits Scroll", "Créditos formales, referencias bibliográficas y agradecimientos"},
	{"closing-cta-centered", "closing", "Closing CTA Centered", "Llamado a la acción central para demos o siguientes pasos"},
	{"closing-next-steps", "closing", "Closing Next Steps", "Hoja de ruta inmediata con próximos pasos del proyecto"},
	{"closing-thank-you", "closing", "Closing Thank You", "Agradecimiento institucional formal de clausura"},
}

func ListCategories() []string {
	return officialCategories
}

func ListThemes() []ThemeInfo {
	return officialThemes
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
